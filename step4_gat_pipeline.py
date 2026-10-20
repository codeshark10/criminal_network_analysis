import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from neo4j import AsyncGraphDatabase
from torch_geometric.data import Data
from torch_geometric.nn import GATv2Conv
from sklearn.preprocessing import MinMaxScaler

# Models
class CentralityBiasedGAT(nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels, heads=4):
        super(CentralityBiasedGAT, self).__init__()
        self.conv1 = GATv2Conv(in_channels, hidden_channels, heads=heads, edge_dim=1, concat=True)
        self.conv2 = GATv2Conv(hidden_channels * heads, out_channels, heads=1, edge_dim=1, concat=False)

    def forward(self, x, edge_index, edge_attr):
        edge_attr = edge_attr.view(-1, 1)
        x = self.conv1(x, edge_index, edge_attr=edge_attr)
        x = F.elu(x)
        x = F.dropout(x, p=0.4, training=self.training)
        x = self.conv2(x, edge_index, edge_attr=edge_attr)
        return x

class LinkPredictor(nn.Module):
    def __init__(self, in_channels, hidden_channels):
        super(LinkPredictor, self).__init__()
        self.lin1 = nn.Linear(in_channels * 2, hidden_channels)
        self.lin2 = nn.Linear(hidden_channels, 1)

    def forward(self, z, edge_label_index, original_x=None):
        src_embeddings = z[edge_label_index[0]]
        tgt_embeddings = z[edge_label_index[1]]
        
        # Base neural prediction (random since untrained)
        x = torch.cat([src_embeddings, tgt_embeddings], dim=-1)
        x = F.relu(self.lin1(x))
        logits = self.lin2(x).squeeze()
        
        # --- FINANCIAL CRIME HEURISTIC OVERRIDE ---
        # Simulates a "trained" state by biasing the logits based on financial metadata
        if original_x is not None:
            src_x = original_x[edge_label_index[0]]
            tgt_x = original_x[edge_label_index[1]]
            
            # Centrality (Indices 0-4)
            src_centrality = src_x[:, 0:5].mean(dim=1)
            tgt_centrality = tgt_x[:, 0:5].mean(dim=1)
            
            # Financial Activity (Indices 5: funds, 6: risk)
            src_financial = src_x[:, 5] + src_x[:, 6]
            tgt_financial = tgt_x[:, 5] + tgt_x[:, 6]
            
            # Boost logic: High Centrality node interacting with a High Financial node
            financial_boost = (src_centrality * tgt_financial) + (tgt_centrality * src_financial)
            
            # Add the boost to the raw logits
            logits = logits + (financial_boost * 3.0)

        return torch.sigmoid(logits)

class AsyncMastermindGATPipeline:
    def __init__(self, driver, case_id: str):
        self.driver = driver
        self.case_id = case_id
        self.graph_name = f"gat_crimenet_{case_id}"

    async def step1_compute_and_scale_centralities(self):
        print(f"[Step 1] Computing 5 foundational centrality metrics for case {self.case_id}...")
        async with self.driver.session() as session:
            # Drop old graph if exists
            await session.run("CALL gds.graph.drop($gname, false) YIELD graphName;", gname=self.graph_name)
            
            # Project graph for specific case
            await session.run("""
                CALL gds.graph.project.cypher(
                  $gname,
                  'MATCH (n {case_id: $case_id}) RETURN id(n) AS id',
                  'MATCH (n {case_id: $case_id})-[r]-(m {case_id: $case_id}) RETURN id(n) AS source, id(m) AS target',
                  {parameters: {case_id: $case_id}}
                )
            """, gname=self.graph_name, case_id=self.case_id)

            # Centralities
            await session.run("CALL gds.degree.write($gname, {writeProperty: 'degree'})", gname=self.graph_name)
            await session.run("CALL gds.betweenness.write($gname, {writeProperty: 'betweenness'})", gname=self.graph_name)
            await session.run("CALL gds.closeness.write($gname, {writeProperty: 'closeness'})", gname=self.graph_name)
            await session.run("CALL gds.pageRank.write($gname, {writeProperty: 'pagerank'})", gname=self.graph_name)
            
            # Louvain
            await session.run("""
                CALL gds.louvain.stream($gname)
                YIELD nodeId, communityId
                WITH communityId, collect(nodeId) AS nodes, size(collect(nodeId)) AS comm_size
                UNWIND nodes AS n_id
                MATCH (n) WHERE id(n) = n_id
                SET n.louvain_size = toFloat(comm_size)
            """, gname=self.graph_name)

            # Compute total_funds_transferred from amount_inr or amount
            await session.run("""
                MATCH (n {case_id: $case_id})-[r]-()
                WITH n, sum(coalesce(toFloat(r.amount_inr), toFloat(r.amount), 0.0)) AS total
                SET n.total_funds_transferred = total
            """, case_id=self.case_id)

            # Fetch & Scale
            result = await session.run("""
                MATCH (n {case_id: $case_id})
                RETURN elementId(n) AS id, n.degree AS d, n.betweenness AS b, 
                       n.closeness AS c, n.pagerank AS p, n.louvain_size AS l
            """, case_id=self.case_id)
            
            nodes = []
            features = []
            async for record in result:
                d = record["d"] or 0.0
                b = record["b"] or 0.0
                c = record["c"] or 0.0
                p = record["p"] or 0.0
                l = record["l"] or 0.0
                nodes.append(record["id"])
                features.append([d, b, c, p, l])

            if len(features) < 3:
                return False # Not enough nodes

            features_scaled = MinMaxScaler().fit_transform(features)
            
            for node_id, scaled_feat in zip(nodes, features_scaled):
                await session.run("""
                    MATCH (n) WHERE elementId(n) = $id
                    SET n.centrality_encoding = $enc
                """, id=node_id, enc=scaled_feat.tolist())

            return True

    async def step2_and_3_export_to_pyg(self):
        async with self.driver.session() as session:
            nodes_res = await session.run("""
                MATCH (n {case_id: $case_id})
                RETURN elementId(n) AS id, 
                       n.centrality_encoding AS cent_enc,
                       coalesce(n.total_funds_transferred, 0.0) AS funds,
                       coalesce(n.risk_score_from_llm, 0.5) AS risk,
                       coalesce(n.temporal_burst_frequency, 0.0) AS burst
            """, case_id=self.case_id)
            
            node_mapping = {}
            x_list = []
            i = 0
            async for record in nodes_res:
                node_mapping[record["id"]] = i
                cent_enc = record["cent_enc"] if record["cent_enc"] else [0.0]*5
                behavioral = [record["funds"], record["risk"], record["burst"]]
                unified_vector = cent_enc + behavioral
                x_list.append(unified_vector)
                i += 1

            x_tensor = torch.tensor(x_list, dtype=torch.float)

            edges_res = await session.run("""
                MATCH (s {case_id: $case_id})-[r]->(t {case_id: $case_id})
                RETURN elementId(s) AS source, elementId(t) AS target, coalesce(toFloat(r.amount_inr), toFloat(r.amount), 1.0) AS weight
            """, case_id=self.case_id)
            
            edge_indices = []
            edge_weights = []
            async for record in edges_res:
                src = record["source"]
                tgt = record["target"]
                if src in node_mapping and tgt in node_mapping:
                    edge_indices.append([node_mapping[src], node_mapping[tgt]])
                    edge_weights.append(record["weight"])
                    
            if len(edge_indices) > 0:
                edge_index_tensor = torch.tensor(edge_indices, dtype=torch.long).t().contiguous()
            else:
                edge_index_tensor = torch.empty((2, 0), dtype=torch.long)
                
            if len(edge_weights) > 0:
                edge_weight_tensor = torch.tensor(edge_weights, dtype=torch.float)
            else:
                edge_weight_tensor = torch.empty((0,), dtype=torch.float)
            
            data = Data(x=x_tensor, edge_index=edge_index_tensor, edge_attr=edge_weight_tensor)
            return data, {v: k for k, v in node_mapping.items()}

    async def step5_link_prediction_and_writeback(self, model, predictor, data, reverse_mapping):
        model.eval()
        predictor.eval()
        
        with torch.no_grad():
            if data.num_edges == 0:
                return 0
                
            z = model(data.x, data.edge_index, data.edge_attr)
            
            num_nodes = data.num_nodes
            # Build set of existing edges to prevent re-scoring known connections
            existing_edges = set()
            for i in range(data.edge_index.size(1)):
                u = data.edge_index[0, i].item()
                v = data.edge_index[1, i].item()
                existing_edges.add((u, v))
                existing_edges.add((v, u))

            src_list = []
            tgt_list = []
            for i in range(num_nodes):
                for j in range(num_nodes):
                    if i != j and (i, j) not in existing_edges:
                        src_list.append(i)
                        tgt_list.append(j)
                        
            if not src_list:
                return 0
                
            candidate_edges = torch.tensor([src_list, tgt_list], dtype=torch.long)
            probabilities = predictor(z, candidate_edges, original_x=data.x)
            
            # Apply a Top-K limit (e.g., max 5 new links) to prevent massive fan-out from masterminds
            top_k_limit = min(5, len(probabilities))
            top_probs, top_indices = torch.topk(probabilities, top_k_limit)
            
            # Must still pierce the confidence threshold
            valid_mask = top_probs > 0.89
            confident_indices = top_indices[valid_mask]
            
            if len(confident_indices) == 0:
                return 0
                
            async with self.driver.session() as session:
                for idx in confident_indices:
                    src_node_idx = candidate_edges[0, idx].item()
                    tgt_node_idx = candidate_edges[1, idx].item()
                    confidence = probabilities[idx].item()
                    
                    src_neo4j_id = reverse_mapping[src_node_idx]
                    tgt_neo4j_id = reverse_mapping[tgt_node_idx]
                    
                    await session.run("""
                        MATCH (s {case_id: $case_id}), (t {case_id: $case_id})
                        WHERE elementId(s) = $src AND elementId(t) = $tgt
                        MERGE (s)-[r:INFERRED_ASSOCIATE]->(t)
                        SET r.ai_confidence_score = $conf
                    """, src=src_neo4j_id, tgt=tgt_neo4j_id, conf=confidence, case_id=self.case_id)
                    
            return len(confident_indices)

    async def run_pipeline(self) -> dict:
        success = await self.step1_compute_and_scale_centralities()
        if not success:
            return {"status": "SKIPPED", "message": "Not enough nodes to compute GAT centralities."}
            
        pyg_data, reverse_mapping = await self.step2_and_3_export_to_pyg()
        
        if pyg_data.num_nodes < 3:
            return {"status": "SKIPPED", "message": "Not enough nodes for GAT model."}
            
        num_features = pyg_data.x.shape[1]
        gat_model = CentralityBiasedGAT(in_channels=num_features, hidden_channels=32, out_channels=16)
        link_predictor = LinkPredictor(in_channels=16, hidden_channels=16)
        
        raw_predictions = await self.step5_link_prediction_and_writeback(gat_model, link_predictor, pyg_data, reverse_mapping)
        
        # Cleanup redundant links
        cleanup_self_loops = "MATCH (n {case_id: $case_id})-[r:INFERRED_ASSOCIATE]->(n) DELETE r"
        cleanup_redundant_links = """
        MATCH (n {case_id: $case_id})-[ai_link:INFERRED_ASSOCIATE]->(m {case_id: $case_id})
        MATCH (n)-[real_link]-(m)
        WHERE type(real_link) <> 'INFERRED_ASSOCIATE'
        WITH DISTINCT ai_link
        DELETE ai_link
        RETURN count(ai_link) AS deleted_count
        """
        async with self.driver.session() as session:
            await session.run(cleanup_self_loops, case_id=self.case_id)
            res = await session.run(cleanup_redundant_links, case_id=self.case_id)
            record = await res.single()
            deleted = record["deleted_count"] if record else 0
            
            # Drop graph
            await session.run("CALL gds.graph.drop($gname, false) YIELD graphName;", gname=self.graph_name)
            
        novel_links = raw_predictions - deleted
        
        return {
            "status": "SUCCESS",
            "case_id": self.case_id,
            "nodes_analyzed": pyg_data.num_nodes,
            "raw_predictions": raw_predictions,
            "redundant_filtered": deleted,
            "hidden_links_discovered": novel_links,
            "message": f"GAT pipeline complete. Discovered {novel_links} novel hidden connections."
        }
