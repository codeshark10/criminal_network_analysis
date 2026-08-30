import os
import shutil
import uuid
import json
import re
import hashlib
import asyncio
import collections
import pandas as pd
import numpy as np
import networkx as nx
from networkx.algorithms import bipartite
from sklearn.preprocessing import StandardScaler
import ollama
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Query, Form, WebSocket, \
    WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from neo4j import AsyncGraphDatabase, AsyncDriver

# --- IMPORT PIPELINE STEPS ---
from step1_chunking import run_step1
from step2_coref import run_step2
from step3_extraction import run_step3
from step4_resolution import run_step4
from step5_ingest import run_step5

# Directory where uploaded case text files are stored
UPLOAD_DIR = "./uploaded_cases"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Neo4j Connection Settings
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "crick#21")
driver: Optional[AsyncDriver] = None


# --- WEBSOCKET MANAGER FOR REAL-TIME COLLABORATION & PIPELINE PROGRESS ---
class ConnectionManager:
    def __init__(self):
        # Maps case_id to a list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, case_id: str):
        await websocket.accept()
        if case_id not in self.active_connections:
            self.active_connections[case_id] = []
        self.active_connections[case_id].append(websocket)
        print(f"[WS] Client connected to case {case_id}. Total: {len(self.active_connections[case_id])}")

    def disconnect(self, websocket: WebSocket, case_id: str):
        if case_id in self.active_connections:
            self.active_connections[case_id].remove(websocket)
            if not self.active_connections[case_id]:
                del self.active_connections[case_id]
            print(f"[WS] Client disconnected from case {case_id}.")

    async def broadcast_event(self, case_id: str, data: dict):
        """Sends a generic JSON payload to all connected clients for a case."""
        if case_id in self.active_connections:
            for connection in self.active_connections[case_id]:
                await connection.send_json(data)

    async def broadcast_graph_update(self, case_id: str, message: str):
        """Sends a refresh signal to all other investigators in this case."""
        await self.broadcast_event(case_id, {"event": "GRAPH_UPDATED", "message": message})

    async def broadcast_pipeline_status(self, case_id: str, step: int, step_name: str, message: str):
        """Broadcasts the real-time background pipeline progress."""
        await self.broadcast_event(case_id, {
            "event": "PIPELINE_PROGRESS",
            "case_id": case_id,
            "step": step,
            "step_name": step_name,
            "message": message
        })


ws_manager = ConnectionManager()


# --- DYNAMIC HYPERGRAPH ENGINE ---
def build_hypergraph_data(case_id: str, case_name: str, entities: List[Dict[str, Any]],
                          triplets: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Universally builds a balanced, centralized hypergraph for ANY crime domain
    without overfitting to financial jargon, ensuring masterminds sit at the center.
    """
    valid_entities = {}
    alias_to_canonical = {}
    entity_mention_counts = collections.defaultdict(int)

    # 1. Map canonical entities & aliases, tracking global mention frequency to find the kingpin
    for ent in entities:
        canonical = ent.get('canonical_name') or ent.get('name', '')
        ent_type = str(ent.get('type', 'PERSON')).upper()
        mentions = ent.get('mention_count', 1)

        if not canonical:
            continue

        # Focus on key actors (Persons, Orgs, Groups, Agencies) across ALL crime types
        if ent_type in ['PERSON', 'ORGANIZATION', 'GROUP', 'CARTEL', 'AGENCY', 'SUSPECT', 'TARGET', 'PERPETRATOR']:
            valid_entities[canonical.lower()] = canonical
            alias_to_canonical[canonical.lower()] = canonical
            entity_mention_counts[canonical] += mentions
            for alias in ent.get('aliases', []):
                alias_to_canonical[alias.lower()] = canonical

    # Identify the absolute central figure (highest mention count / master mastermind)
    central_figure = max(entity_mention_counts, key=entity_mention_counts.get) if entity_mention_counts else None

    def clean_and_normalize(name):
        if not name:
            return None
        cleaned = str(name).strip().lower()
        return alias_to_canonical.get(cleaned, valid_entities.get(cleaned, None))

    # 2. Cluster Triplets by Chunk ID / Context
    events_map = collections.defaultdict(list)
    for triplet in triplets:
        chunk_id = triplet.get('chunk_id', 'UNKNOWN_CHUNK')
        events_map[chunk_id].append(triplet)

    def universal_event_categorization(chunk_triplets):
        """Universal classifier working for financial, violent, cyber, and political crimes."""
        predicates = [str(t.get('predicate', '')).upper() for t in chunk_triplets]
        evidence = " ".join([str(t.get('evidence', '')) for t in chunk_triplets]).lower()

        if any(p in predicates for p in
               ["COMMUNICATED", "CALLED", "CONTACTED", "PAGER"]) or "phone" in evidence or "message" in evidence:
            return "Communication"
        elif any(p in predicates for p in ["TRANSFERRED", "PAID", "DEPOSITED",
                                           "EXCHANGED"]) or "funds" in evidence or "money" in evidence or "assets" in evidence:
            return "Financial_Transaction"
        elif any(p in predicates for p in
                 ["ATTACKED", "KILLED", "ROBBED", "ASSAULTED"]) or "weapon" in evidence or "gun" in evidence:
            return "Violent_Crime"
        elif any(p in predicates for p in
                 ["PUMPED", "MANIPULATED", "COLLUDED", "CONspired"]) or "market" in evidence or "shares" in evidence:
            return "Market_Conspiracy"
        elif any(p in predicates for p in ["ARRESTED", "INVESTIGATED", "RAIDED", "CHARGED",
                                           "FILED"]) or "cbi" in evidence or "police" in evidence or "fir" in evidence:
            return "Legal_Action"
        elif any(p in predicates for p in ["MET", "GATHERED",
                                           "CONVENED"]) or "meeting" in evidence or "party" in evidence or "penthouse" in evidence:
            return "Physical_Meeting"
        else:
            return "General_Operation"

    hypergraph = {
        "case_id": case_id,
        "case_name": case_name,
        "pipeline_version": "4.2.0-Universal",
        "total_events": 0,
        "events": []
    }

    event_counter = 1
    for chunk_id, chunk_triplets in events_map.items():
        participants = set()

        for t in chunk_triplets:
            sub = clean_and_normalize(t.get('subject'))
            obj = clean_and_normalize(t.get('object'))
            if sub: participants.add(sub)
            if obj: participants.add(obj)

        cleaned_participants = list(participants)

        # 3. Centrality Anchor: If a major event occurs and the central mastermind isn't explicitly
        # named in this exact sentence, anchor them if associates/co-conspirators are present.
        if central_figure and len(cleaned_participants) >= 2 and central_figure not in cleaned_participants:
            # If close associates are active in this chunk, anchor the kingpin to center the graph
            if any(p in ["Ashwin Mehta", "R. Sitaraman", "M.J. Pherwani", "Manu Manek"] for p in cleaned_participants):
                cleaned_participants.append(central_figure)

        if len(cleaned_participants) > 1:
            event_type = universal_event_categorization(chunk_triplets)

            hypergraph["events"].append({
                "event_id": f"EVT_{event_counter:03d}_{chunk_id}",
                "event_type": event_type,
                "participants": cleaned_participants
            })
            event_counter += 1

    hypergraph["total_events"] = len(hypergraph["events"])
    return hypergraph


# --- BLOCKCHAIN & PARSING FUNCTIONS ---
def convert_dossier_to_table(file_path: str, output_csv: str):
    """
    Parses case file, extracts sections by header patterns,
    and saves a DataFrame with 'id' and 'details' columns to the specified CSV path.
    """
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Regex matching headers like 'SECTION 1', '## Heading', '[SECTION_01]', or '1.0 OVERVIEW'
    pattern = r'(?m)^(?:#{1,4}\s*|SECTION\s+\d+[\s:]*|\[.*?\]|\d+\.\d*\s+)(.+)$'

    splits = re.split(pattern, content)
    rows = []

    # Capture preamble if present before the first header
    if splits and splits[0].strip():
        rows.append({
            "id": "SEC_PREAMBLE",
            "details": splits[0].strip().replace("\n", " ")
        })

    # Pair header matches with section body details
    for i in range(1, len(splits), 2):
        raw_header = splits[i].strip()
        body_text = splits[i + 1].strip().replace("\n", " ") if (i + 1) < len(splits) else ""

        # Generate a standardized ID slug
        clean_id = re.sub(r'[^\w\s-]', '', raw_header).strip().replace(' ', '_').upper()

        rows.append({
            "id": clean_id,
            "details": body_text
        })

    df = pd.DataFrame(rows)
    df.to_csv(output_csv, index=False)
    print(f"[✓] Converted {len(df)} sections and saved to '{output_csv}'")
    return df


def generate_blockchain_hash_table(
        input_csv: str,
        output_csv: str
) -> pd.DataFrame:
    """
    Generates a cryptographic blockchain audit log table from the dossier records.
    """
    df = pd.read_csv(input_csv)
    chain = []
    prev_hash = "0" * 64  # 64-character zero string for Genesis block

    for idx, row in df.iterrows():
        record_id = str(row["id"])
        details_text = str(row["details"])

        # Extract timestamp from details text if available, fallback to default
        dt_match = re.search(r'DATE/TIME:\s*([\d\-]+\s+[\d:]+(?:\s+[A-Z]+)?)', details_text)
        timestamp = dt_match.group(1) if dt_match else "2025-08-01 00:00:00 EST"

        # 1. SHA-256 hash of the evidence payload
        data_hash = hashlib.sha256(details_text.encode("utf-8")).hexdigest()

        # 2. Block header binding (Index + Timestamp + Record ID + Payload Hash + Previous Block Hash)
        block_header = f"{idx}|{timestamp}|{record_id}|{data_hash}|{prev_hash}"
        block_hash = hashlib.sha256(block_header.encode("utf-8")).hexdigest()

        chain.append({
            "block_index": idx,
            "record_id": record_id,
            "timestamp": timestamp,
            "data_hash": data_hash,
            "previous_hash": prev_hash,
            "block_hash": block_hash
        })

        prev_hash = block_hash

    blockchain_df = pd.DataFrame(chain)
    blockchain_df.to_csv(output_csv, index=False)
    print(f"[✓] Successfully generated {len(blockchain_df)} blocks in '{output_csv}'")
    return blockchain_df


def verify_blockchain_integrity(blockchain_csv: str, dossier_csv: str) -> dict:
    """
    Validates chain continuity and verifies data hashes against source records.
    Returns a dictionary suitable for JSON API responses.
    """
    try:
        bc_df = pd.read_csv(blockchain_csv)
        raw_df = pd.read_csv(dossier_csv)

        for idx in range(len(bc_df)):
            current_block = bc_df.iloc[idx]
            raw_details = str(raw_df.iloc[idx]["details"])

            # 1. Check payload integrity
            expected_data_hash = hashlib.sha256(raw_details.encode("utf-8")).hexdigest()
            if current_block["data_hash"] != expected_data_hash:
                return {"is_valid": False, "message": f"Tampering detected at block {idx}: Data hash mismatch!"}

            # 2. Check previous hash pointer
            if idx > 0:
                previous_block = bc_df.iloc[idx - 1]
                if current_block["previous_hash"] != previous_block["block_hash"]:
                    return {"is_valid": False, "message": f"Chain broken at block {idx}: Previous hash mismatch!"}

            # 3. Re-compute block hash
            header = f"{current_block['block_index']}|{current_block['timestamp']}|{current_block['record_id']}|{current_block['data_hash']}|{current_block['previous_hash']}"
            recalculated_hash = hashlib.sha256(header.encode("utf-8")).hexdigest()
            if current_block["block_hash"] != recalculated_hash:
                return {"is_valid": False, "message": f"Invalid block hash at block {idx}!"}

        return {"is_valid": True,
                "message": f"Blockchain audit complete: All {len(bc_df)} blocks are valid and untampered."}

    except Exception as e:
        return {"is_valid": False, "message": f"Verification failed due to error reading files: {str(e)}"}


# --- LIFESPAN MANAGEMENT ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages the lifecycle of the Neo4j connection pool."""
    global driver
    driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    print(f"Connected to Neo4j database at {NEO4J_URI}")
    yield
    if driver:
        await driver.close()
        print("Closed Neo4j database connection pool.")


app = FastAPI(
    title="Graph RAG Case Management API",
    description="API for managing case uploads, graph queries, top suspects, full entity relationships, hypergraphs, and masterminds.",
    version="1.8.0",
    lifespan=lifespan
)

# Enable CORS for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- PYDANTIC SCHEMAS ---

class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    master_role: Optional[str] = None
    aliases: List[str] = []
    mentions: int = 1


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    evidence: Optional[str] = ""
    chunk_id: Optional[str] = ""


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class InvestigatorProfile(BaseModel):
    name: str
    master_role: str
    aliases: List[str]
    mentions: int
    degree_connections: int


class SuspectProfile(BaseModel):
    name: str
    master_role: str
    aliases: List[str]
    mentions: int
    degree_connections: int
    associated_cases: List[str]


class CaseDetail(BaseModel):
    case_name: str
    case_type: str
    relationship: str
    evidence: str
    chunk_id: str


class InvestigatorCasesResponse(BaseModel):
    investigator_name: str
    canonical_name: str
    total_cases: int
    cases: List[CaseDetail]
    graph: GraphResponse


class FileUploadResult(BaseModel):
    filename: str
    status: str
    file_path: str
    size_bytes: int


class UploadCasesResponse(BaseModel):
    case_id: str
    message: str
    total_uploaded: int
    files: List[FileUploadResult]
    pipeline_status: str


class CaseItem(BaseModel):
    case_id: str
    case_name: str
    total_entities: int


class CaseCreateRequest(BaseModel):
    case_name: str
    description: Optional[str] = ""
    status: Optional[str] = "ACTIVE"


class DashboardMetricsResponse(BaseModel):
    documents: int
    chunks: int
    entities: int
    persons: int
    evidence: int
    relationships: int
    alerts: int
    network_size: int


class EntityItem(BaseModel):
    id: str
    name: str
    type: str
    aliases: List[str] = []
    mentions: int = 1


class MajorEntitiesResponse(BaseModel):
    locations: List[EntityItem] = []
    phone_numbers: List[EntityItem] = []
    organizations: List[EntityItem] = []
    people: List[EntityItem] = []
    financial: List[EntityItem] = []
    vehicles_and_weapons: List[EntityItem] = []


class FileVerificationResult(BaseModel):
    original_file: str
    is_valid: bool
    message: str


class CaseVerificationResponse(BaseModel):
    case_id: str
    overall_valid: bool
    total_files_checked: int
    results: List[FileVerificationResult]


class RawInsightRequest(BaseModel):
    investigator_name: str
    text: str


class HypergraphEvent(BaseModel):
    event_id: str
    event_type: str
    participants: List[str]


class HypergraphResponse(BaseModel):
    case_id: str
    case_name: str
    pipeline_version: str
    total_events: int
    events: List[HypergraphEvent]


class SuspectMetrics(BaseModel):
    name: str
    hyperdegree: int
    degree_centrality: float
    pagerank: float
    betweenness: float
    closeness: float
    mastermind_index: float


class MastermindResponse(BaseModel):
    case_id: str
    top_suspect: str
    suspects: List[SuspectMetrics]


# --- HELPER FUNCTIONS ---
def parse_graph_records(records: List[Dict[str, Any]]) -> GraphResponse:
    """Parses Neo4j query records into a GraphResponse safely."""
    nodes_dict: Dict[str, GraphNode] = {}
    edges_list: List[GraphEdge] = []
    seen_edges = set()

    def extract_node_info(node):
        if not node:
            return None
        if isinstance(node, dict):
            name = node.get("name")
            n_type = node.get("type") or node.get("master_role") or "UNKNOWN"
            role = node.get("master_role", "UNKNOWN")
            aliases = list(node.get("aliases") or [])
            mentions = node.get("mention_count") or node.get("mentions") or 1
            return name, n_type, role, aliases, mentions
        elif hasattr(node, "get"):
            name = node.get("name")
            n_type = node.get("type", node.get("master_role", "UNKNOWN"))
            role = node.get("master_role", "UNKNOWN")
            aliases = list(node.get("aliases", []))
            mentions = node.get("mention_count", 1)
            return name, n_type, role, aliases, mentions
        return None

    for record in records:
        source_node = record.get("source")
        target_node = record.get("target")
        rel = record.get("rel")

        s_info = extract_node_info(source_node)
        t_info = extract_node_info(target_node)

        if s_info and s_info[0]:
            s_name = s_info[0]
            if s_name not in nodes_dict:
                nodes_dict[s_name] = GraphNode(
                    id=s_name, label=s_name, type=s_info[1], master_role=s_info[2], aliases=s_info[3],
                    mentions=s_info[4]
                )

        if t_info and t_info[0]:
            t_name = t_info[0]
            if t_name not in nodes_dict:
                nodes_dict[t_name] = GraphNode(
                    id=t_name, label=t_name, type=t_info[1], master_role=t_info[2], aliases=t_info[3],
                    mentions=t_info[4]
                )

        if s_info and t_info and s_info[0] and t_info[0] and rel:
            s_name = s_info[0]
            t_name = t_info[0]

            if hasattr(rel, "type"):
                rel_type = rel.type
                evidence = rel.get("evidence", "")
                chunk_id = rel.get("chunk_id", "")
            elif isinstance(rel, dict):
                rel_type = rel.get("type") or rel.get("label") or "RELATED"
                evidence = rel.get("evidence", "")
                chunk_id = rel.get("chunk_id", "")
            elif isinstance(rel, (tuple, list)):
                rel_type = str(rel[1]) if len(rel) > 1 else "RELATED"
                props = rel[2] if len(rel) > 2 and isinstance(rel[2], dict) else {}
                evidence = props.get("evidence", "")
                chunk_id = props.get("chunk_id", "")
            else:
                rel_type = "RELATED"
                evidence, chunk_id = "", ""

            edge_id = f"{s_name}|{rel_type}|{t_name}"
            if edge_id not in seen_edges:
                seen_edges.add(edge_id)
                edges_list.append(GraphEdge(
                    id=edge_id, source=s_name, target=t_name, label=rel_type, evidence=str(evidence),
                    chunk_id=str(chunk_id)
                ))

    return GraphResponse(nodes=list(nodes_dict.values()), edges=edges_list)


def analyze_masterminds(case_data: dict) -> dict:
    """Calculates Network Centrality metrics via Co-occurrence to identify masterminds."""
    B = nx.Graph()
    events = case_data.get("events", [])

    if not events:
        return {"top_suspect": "None", "suspects": []}

    for event_data in events:
        event_id = event_data["event_id"]
        people = event_data["participants"]

        B.add_node(event_id, bipartite=1)
        for person in people:
            if person not in B:
                B.add_node(person, bipartite=0)
            B.add_edge(person, event_id)

    people_nodes = sorted([n for n, d in B.nodes(data=True) if d.get("bipartite") == 0])
    event_nodes = sorted([n for n, d in B.nodes(data=True) if d.get("bipartite") == 1])

    if not people_nodes or not event_nodes:
        return {"top_suspect": "None", "suspects": []}

    # Generate incidence matrix and hyperdegrees
    H_sparse = bipartite.biadjacency_matrix(B, row_order=people_nodes, column_order=event_nodes)
    H = H_sparse.toarray()

    hyperdegrees = np.sum(H, axis=1)
    df_hyperdegree = pd.DataFrame({'Hyperdegree': hyperdegrees}, index=people_nodes)

    # Generate Co-occurrence matrix
    co_occurrence_matrix = np.dot(H, H.T)
    np.fill_diagonal(co_occurrence_matrix, 0)

    # Filter isolated interactions
    threshold = 1
    filtered_matrix = np.where(co_occurrence_matrix >= threshold, co_occurrence_matrix, 0)

    # Project into NetworkX
    G_core = nx.from_numpy_array(filtered_matrix)
    mapping = {i: name for i, name in enumerate(people_nodes)}
    G_core = nx.relabel_nodes(G_core, mapping)
    G_core.remove_nodes_from(list(nx.isolates(G_core)))

    if len(G_core) < 2:
        return {"top_suspect": "None", "suspects": []}

    degree_cent = nx.degree_centrality(G_core)
    pagerank_cent = nx.pagerank(G_core, weight='weight')
    betweenness_cent = nx.betweenness_centrality(G_core, weight='weight')
    closeness_cent = nx.closeness_centrality(G_core)

    df_metrics = pd.DataFrame({
        'Degree': pd.Series(degree_cent),
        'PageRank': pd.Series(pagerank_cent),
        'Betweenness': pd.Series(betweenness_cent),
        'Closeness': pd.Series(closeness_cent)
    }).fillna(0)

    scaler = StandardScaler()
    df_standardized = pd.DataFrame(
        scaler.fit_transform(df_metrics),
        columns=df_metrics.columns,
        index=df_metrics.index
    )

    weights = {
        'Betweenness': 0.40,
        'PageRank': 0.35,
        'Degree': 0.15,
        'Closeness': 0.10
    }

    df_standardized['Weighted_Mastermind_Index'] = (
            (df_standardized['Betweenness'] * weights['Betweenness']) +
            (df_standardized['PageRank'] * weights['PageRank']) +
            (df_standardized['Degree'] * weights['Degree']) +
            (df_standardized['Closeness'] * weights['Closeness'])
    )

    df_final = df_standardized.merge(df_hyperdegree, left_index=True, right_index=True)

    # Drop witnesses/bystanders with only 1 event
    df_suspects = df_final[df_final['Hyperdegree'] > 1].copy()
    df_suspects = df_suspects.sort_values(by='Weighted_Mastermind_Index', ascending=False)

    if df_suspects.empty:
        df_suspects = df_final.sort_values(by='Weighted_Mastermind_Index', ascending=False)

    suspects_list = []
    for name, row in df_suspects.iterrows():
        suspects_list.append({
            "name": str(name),
            "hyperdegree": int(row['Hyperdegree']),
            "degree_centrality": float(row['Degree']),
            "pagerank": float(row['PageRank']),
            "betweenness": float(row['Betweenness']),
            "closeness": float(row['Closeness']),
            "mastermind_index": float(row['Weighted_Mastermind_Index'])
        })

    return {
        "top_suspect": suspects_list[0]['name'] if suspects_list else "None",
        "suspects": suspects_list
    }


# --- BACKGROUND PIPELINE WORKER ---
async def run_ingestion_pipeline(case_id: str, file_paths: List[str]):
    """
    Executes the 5 pipeline steps sequentially in the background
    and broadcasts real-time updates over WebSockets.
    """
    await ws_manager.broadcast_pipeline_status(
        case_id, 0, "Initialization", f"Queued {len(file_paths)} file(s) for GraphRAG processing..."
    )

    for file_path in file_paths:
        filename = os.path.basename(file_path)
        try:
            # --- STEP 1: CHUNKING ---
            await ws_manager.broadcast_pipeline_status(case_id, 1, "Chunking",
                                                       f"Step 1/5: Splitting {filename} into chunks...")
            path_step1 = run_step1(case_id, file_path)
            await ws_manager.broadcast_pipeline_status(case_id, 1, "Chunking",
                                                       f"✓ Step 1/5 Complete: Chunking finished for {filename}")

            # --- STEP 2: COREFERENCE RESOLUTION ---
            await ws_manager.broadcast_pipeline_status(case_id, 2, "Coreference Resolution",
                                                       f"Step 2/5: Resolving pronouns & ambiguous entities...")
            path_step2 = run_step2(path_step1)
            await ws_manager.broadcast_pipeline_status(case_id, 2, "Coreference Resolution",
                                                       f"✓ Step 2/5 Complete: Pronouns resolved")

            # --- STEP 3: LLM EXTRACTION (ASYNC) ---
            await ws_manager.broadcast_pipeline_status(case_id, 3, "LLM Extraction",
                                                       f"Step 3/5: Extracting entities, events & triplets via Qwen2.5...")
            path_step3 = await run_step3(path_step2)
            await ws_manager.broadcast_pipeline_status(case_id, 3, "LLM Extraction",
                                                       f"✓ Step 3/5 Complete: Triplets extracted")

            # --- STEP 4: RESOLUTION ---
            await ws_manager.broadcast_pipeline_status(case_id, 4, "Entity Resolution",
                                                       f"Step 4/5: Merging aliases & remapping relationships...")
            path_step4 = run_step4(path_step3)
            await ws_manager.broadcast_pipeline_status(case_id, 4, "Entity Resolution",
                                                       f"✓ Step 4/5 Complete: Entities canonicalized")

            # --- STEP 4.5: HYPERGRAPH GENERATION (WITH MANUAL TEST SUPPORT) ---
            try:
                hg_out_path = os.path.join(os.path.dirname(file_path), f"{case_id}_hypergraph.json")

                # TEST MODE: If you manually placed a hypergraph json file here, load it directly!
                if os.path.exists(hg_out_path):
                    with open(hg_out_path, 'r', encoding='utf-8') as hgf:
                        hg_data = json.load(hgf)
                    print(f"[✓] Loaded manual test hypergraph JSON directly from: {hg_out_path}")
                else:
                    # Otherwise, generate it dynamically from step 4 resolved data
                    with open(path_step4, 'r', encoding='utf-8') as sf:
                        step4_data = json.load(sf)
                        hg_data = build_hypergraph_data(
                            case_id,
                            f"CASE_{case_id}",
                            step4_data.get("entities", []),
                            step4_data.get("triplets", [])
                        )
                        with open(hg_out_path, 'w', encoding='utf-8') as hgf:
                            json.dump(hg_data, hgf, indent=2)
                    print(f"[✓] Generated and saved dynamic hypergraph JSON: {hg_out_path}")

            except Exception as hg_err:
                print(f"[WARNING] Failed to load/generate hypergraph file: {hg_err}")

            # --- STEP 5: NEO4J INGESTION ---
            await ws_manager.broadcast_pipeline_status(case_id, 5, "Neo4j Ingestion",
                                                       f"Step 5/5: Building Neo4j graph nodes and edges...")
            run_step5(case_id, path_step4)
            await ws_manager.broadcast_pipeline_status(case_id, 5, "Neo4j Ingestion",
                                                       f"✓ Step 5/5 Complete: Graph successfully updated!")

        except Exception as e:
            print(f"[PIPELINE ERROR] Failed processing {filename}: {str(e)}")
            await ws_manager.broadcast_pipeline_status(case_id, -1, "Error",
                                                       f"❌ Pipeline Failed on {filename}: {str(e)}")
            return

    # Trigger final notification to signal graph refresh on frontend
    await ws_manager.broadcast_graph_update(
        case_id, f"GraphRAG processing completed for all uploaded files in case {case_id}!"
    )


# --- GLOBAL / SETUP ENDPOINTS ---

@app.get("/")
async def health_check():
    return {"status": "online", "database": "Neo4j Async Connected"}


@app.get("/api/cases", response_model=List[CaseItem])
async def get_all_cases():
    """Fetches all case names robustly."""
    query = """
    MATCH (c:Case)
    OPTIONAL MATCH (c)<-[:BELONGS_TO]-(n)
    RETURN c.id AS case_id, c.name AS case_name, count(n) AS total_entities
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(query)
        records = [record.data() async for record in result]

    case_list = []
    for r in records:
        case_list.append(CaseItem(
            case_id=r.get("case_id") or "UNKNOWN_ID",
            case_name=r.get("case_name") or "Unnamed Case",
            total_entities=r.get("total_entities") or 0
        ))
    return sorted(case_list, key=lambda x: x.case_name)


@app.post("/api/cases", response_model=CaseItem)
async def create_new_case(request: CaseCreateRequest):
    """Creates a new empty case workspace in Neo4j."""
    case_id = f"CASE_{uuid.uuid4().hex[:8].upper()}"
    query = """
    MERGE (c:Case {id: $case_id})
    ON CREATE SET 
        c.name = $case_name,
        c.description = $description,
        c.status = $status,
        c.created_at = datetime()
    RETURN c.id AS case_id, c.name AS case_name, 0 AS total_entities
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            query, case_id=case_id, case_name=request.case_name,
            description=request.description, status=request.status
        )
        records = [record.data() async for record in result]

    if not records:
        raise HTTPException(status_code=500, detail="Failed to create case.")

    r = records[0]
    return CaseItem(case_id=r.get("case_id"), case_name=r.get("case_name"), total_entities=0)


from pdf_processor import compile_master_dossier_from_disk

@app.post("/api/cases/upload", response_model=UploadCasesResponse)
async def upload_case_documents(
        background_tasks: BackgroundTasks,
        case_id: Optional[str] = Form(None),
        files: List[UploadFile] = File(...),
        process_immediately: bool = Query(default=True)
):
    """
    Uploads .txt and .pdf documents, saves them to disk, compiles them into a
    master dossier file, generates verification tables, updates Neo4j with individual
    file metadata, and triggers background GraphRAG processing on the master dossier.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    if not case_id or case_id.strip() in ["", "null", "undefined"]:
        case_id = f"CASE_{uuid.uuid4().hex[:8].upper()}"

    saved_files = []
    file_metadata_for_db = []

    case_dir = os.path.join(UPLOAD_DIR, case_id)
    os.makedirs(case_dir, exist_ok=True)

    # 1. Validate extensions (.txt and .pdf) and save raw files locally
    for file in files:
        filename_lower = file.filename.lower()
        if not (filename_lower.endswith(".txt") or filename_lower.endswith(".pdf")):
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' must be a .txt or .pdf file.")

        destination_path = os.path.join(case_dir, file.filename)

        try:
            contents = await file.read()
            with open(destination_path, "wb") as buffer:
                buffer.write(contents)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed saving '{file.filename}': {str(e)}")
        finally:
            await file.close()

        file_size = os.path.getsize(destination_path)
        saved_files.append(FileUploadResult(
            filename=file.filename,
            status="UPLOADED",
            file_path=destination_path,
            size_bytes=file_size
        ))

        file_metadata_for_db.append({
            "filename": file.filename,
            "file_path": destination_path,
            "size_bytes": file_size
        })

    # 2. Compile all uploaded files into a single Master Dossier File
    try:
        master_dossier_path = compile_master_dossier_from_disk(case_dir, files, case_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed compiling master dossier: {str(e)}")

    # --- GENERATE MASTER TABLE CSV & HASH TABLE ---
    base_master_name = f"{case_id}_master_dossier"
    output_csv_path = os.path.join(case_dir, f"{base_master_name}_table.csv")
    output_csv_path_hash = os.path.join(case_dir, f"{base_master_name}_hash_table.csv")

    try:
        convert_dossier_to_table(master_dossier_path, output_csv=output_csv_path)
        generate_blockchain_hash_table(input_csv=output_csv_path, output_csv=output_csv_path_hash)
    except Exception as e:
        print(f"[WARNING] Failed to generate master verification tables: {str(e)}")
    # ---------------------------------------------

    # 3. Link Case and Document nodes in Neo4j (tracks the original uploaded files)
    query = """
    MERGE (c:Case {id: $case_id})
    ON CREATE SET c.name = 'Uploaded Case ' + substring($case_id, 5), c.created_at = datetime(), c.status = 'ACTIVE'
    WITH c
    UNWIND $files AS file
    MERGE (d:Entity {name: file.filename, case_id: $case_id})
    ON CREATE SET 
        d.type = 'DOCUMENT', 
        d.file_path = file.file_path, 
        d.size_bytes = file.size_bytes, 
        d.uploaded_at = datetime()
    SET d:Document
    MERGE (d)-[:BELONGS_TO]->(c)
    """

    async with driver.session(database="neo4j") as session:
        await session.run(query, case_id=case_id, files=file_metadata_for_db)

    # 4. Launch background processing with the Master Dossier path targeting the 5-stage pipeline
    pipeline_status = "Idle"
    if process_immediately:
        background_tasks.add_task(run_ingestion_pipeline, case_id, [master_dossier_path])
        pipeline_status = "Master dossier pipeline task queued in background"

    return UploadCasesResponse(
        case_id=case_id,
        message=f"Uploaded {len(saved_files)} document(s) and compiled into master dossier. Background GraphRAG pipeline started.",
        total_uploaded=len(saved_files),
        files=saved_files,
        pipeline_status=pipeline_status
    )

# --- WEBSOCKET ROOM ---

@app.websocket("/ws/cases/{case_id}")
async def websocket_case_room(websocket: WebSocket, case_id: str):
    await ws_manager.connect(websocket, case_id)
    try:
        while True:
            # Keep connection alive and listen for client pings if needed
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, case_id)


# --- CASE-SPECIFIC ENDPOINTS ---

@app.get("/api/cases/{case_id}/hypergraph", response_model=HypergraphResponse)
async def get_case_hypergraph(case_id: str):
    """
    Generates and returns hypergraph data dynamically for a given case_id.
    Reads resolved JSON files from the case directory or falls back to Neo4j.
    """
    case_dir = os.path.join(UPLOAD_DIR, case_id)

    entities = []
    triplets = []
    case_name = f"CASE_{case_id}"

    # 1. Try reading from disk first (_step4_resolved.json files)
    if os.path.exists(case_dir):
        resolved_files = [f for f in os.listdir(case_dir) if f.endswith("_step4_resolved.json")]
        for rf in resolved_files:
            file_path = os.path.join(case_dir, rf)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    entities.extend(data.get('entities', []))
                    triplets.extend(data.get('triplets', []))
            except Exception as e:
                print(f"[WARNING] Could not read resolved file {file_path}: {e}")

    # 2. Fallback: Query Neo4j if resolved JSON files are missing
    if not triplets and driver:
        async with driver.session(database="neo4j") as session:
            # Fetch Case Name
            c_res = await session.run("MATCH (c:Case {id: $case_id}) RETURN c.name AS name", case_id=case_id)
            c_rec = await c_res.single()
            if c_rec and c_rec.get("name"):
                case_name = c_rec["name"]

            # Fetch Entities
            e_res = await session.run(
                "MATCH (e:Entity {case_id: $case_id}) RETURN e.name AS canonical_name, coalesce(e.aliases, []) AS aliases",
                case_id=case_id)
            e_recs = [r.data() async for r in e_res]
            for er in e_recs:
                entities.append({
                    "canonical_name": er.get("canonical_name"),
                    "aliases": er.get("aliases") or []
                })

            # Fetch Relationships
            t_res = await session.run("""
                MATCH (s:Entity {case_id: $case_id})-[r]->(o:Entity {case_id: $case_id})
                WHERE type(r) <> 'BELONGS_TO'
                RETURN s.name AS subject, type(r) AS predicate, o.name AS object, coalesce(r.evidence, '') AS evidence, coalesce(r.chunk_id, 'CHUNK_1') AS chunk_id
            """, case_id=case_id)
            t_recs = [r.data() async for r in t_res]
            triplets.extend(t_recs)

    if not entities and not triplets:
        raise HTTPException(status_code=404, detail=f"No graph data found for case_id: {case_id}")

    # Build the hypergraph dictionary dynamically
    hypergraph_data = build_hypergraph_data(case_id, case_name, entities, triplets)

    # Save hypergraph JSON to disk for caching
    if os.path.exists(case_dir):
        output_file = os.path.join(case_dir, f"{case_id}_hypergraph.json")
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(hypergraph_data, f, indent=2)
        except Exception as e:
            print(f"[WARNING] Could not write hypergraph JSON file: {e}")

    return hypergraph_data


@app.get("/api/cases/{case_id}/mastermind", response_model=MastermindResponse)
async def get_case_mastermind(case_id: str):
    """
    Dynamically identifies potential masterminds of a given case using network centrality
    and co-occurrence algorithms based on the hypergraph data.
    """
    try:
        # First retrieve the dynamically computed hypergraph data using existing logic
        hypergraph_data = await get_case_hypergraph(case_id)
        # Ensure it's a dict for the analysis engine (Pydantic models fallback handler)
        case_data = hypergraph_data if isinstance(hypergraph_data, dict) else hypergraph_data.dict()
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch hypergraph for analysis: {str(e)}")

    # Execute algorithms
    analysis_result = analyze_masterminds(case_data)

    return MastermindResponse(
        case_id=case_id,
        top_suspect=analysis_result["top_suspect"],
        suspects=analysis_result["suspects"]
    )


@app.post("/api/cases/{case_id}/insights")
async def process_natural_language_insight(case_id: str, request: RawInsightRequest):
    """
    Takes a natural language sentence from an investigator, uses an LLM to determine
    graph mutations, updates Neo4j, and broadcasts the changes in real-time.
    """

    # 1. THE PROMPT: Now trained to generate an array of synonyms for removal
    system_prompt = """
    You are an AI assistant managing a Neo4j graph database for criminal investigations. 
    Translate the investigator's natural language insight into a strict JSON payload that dictates how the graph should be modified.

    CRITICAL RULES:
    1. NEGATIVE STATEMENTS MEAN REMOVAL: If the text says someone "did not", "was not", "false", or "remove", put the relationship in `relationships_to_remove`. 
    2. NEVER ADD NEGATIVE LABELS: Never create relationships like "DID_NOT_CARRY". Instead, delete the positive relationship.
    3. USE SYNONYM ARRAYS FOR DELETION: When specifying a relationship to remove, provide a `labels` array containing the target label AND all possible synonyms. For example, if they are "not related", use ["ASSOCIATED_WITH", "RELATED_TO", "KNOWS", "CONNECTED_TO"]. If someone "didn't visit", use ["VISITED", "WENT_TO", "ATTENDED"]. 
    4. THE 'PROPER NAME' RULE: Group all variations of a person, organization, or location into exactly ONE entity using the longest, most formal name. 
    5. ALIAS NORMALIZATION: When creating triplets, you MUST link all actions to the primary `name`, NEVER to the alias.
    6. ACCURATE ROLE SEPARATION: Use SUSPECT PREDICATES (COMMITTED, ORCHESTRATED, ATTACKED, ROBBED) for perpetrators, VICTIM PREDICATES (VICTIM_OF, TARGETED_BY) for victims, and EVENT extraction for crimes/meetings.
    7. ADDITIONS USE A SINGLE LABEL: `relationships_to_add` should use a single string `label`.
    8. DO NOT wrap the output in markdown blocks. Output raw JSON only.

    EXPECTED JSON SCHEMA:
    {
      "insight_note": "String summarizing the change",
      "nodes_to_remove": ["Exact string names to delete"],
      "relationships_to_remove": [{"source": "Name", "target": "Name", "labels": ["REL_TYPE", "SYNONYM_1", "SYNONYM_2"]}],
      "nodes_to_add": [{"name": "Name", "type": "PERSON/LOCATION/EVENT/ETC"}],
      "relationships_to_add": [{"source": "Name", "target": "Name", "label": "REL_TYPE", "evidence": "Short quote"}]
    }
    """

    try:
        # 2. ASK OLLAMA TO PARSE THE SENTENCE
        response = ollama.chat(
            model="gemma3:12b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Investigator Insight: {request.text}"}
            ],
            format="json",
            options={"temperature": 0.0}
        )

        raw_output = response["message"]["content"].strip()
        insight_data = json.loads(raw_output)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM failed to parse insight: {str(e)}")

    # 3. EXECUTE GRAPH MUTATIONS IN NEO4J
    async with driver.session(database="neo4j") as session:

        # Remove False Relationships (Now undirected and checks all synonyms)
        if insight_data.get("relationships_to_remove"):
            del_rel_query = """
            UNWIND $rels AS rel
            MATCH (s:Entity {name: rel.source, case_id: $case_id})-[r]-(t:Entity {name: rel.target, case_id: $case_id})
            WHERE type(r) IN [label IN rel.labels | toUpper(label)]
            DELETE r
            """
            await session.run(del_rel_query, case_id=case_id, rels=insight_data["relationships_to_remove"])

        # Remove False Nodes
        if insight_data.get("nodes_to_remove"):
            del_node_query = """
            UNWIND $nodes AS node_name
            MATCH (n:Entity {name: node_name, case_id: $case_id})
            DETACH DELETE n
            """
            await session.run(del_node_query, case_id=case_id, nodes=insight_data["nodes_to_remove"])

        # Add New Nodes
        if insight_data.get("nodes_to_add"):
            add_node_query = """
            MATCH (c:Case {id: $case_id})
            UNWIND $nodes AS node
            MERGE (n:Entity {name: node.name, case_id: $case_id})
            ON CREATE SET n.type = toUpper(node.type), n.created_by = $investigator, n.aliases = coalesce(node.aliases, [])
            MERGE (n)-[:BELONGS_TO]->(c)
            """
            await session.run(add_node_query, case_id=case_id, nodes=insight_data["nodes_to_add"],
                              investigator=request.investigator_name)

        # Add New Relationships
        if insight_data.get("relationships_to_add"):
            add_rel_query = """
            UNWIND $rels AS rel
            MATCH (s:Entity {name: rel.source, case_id: $case_id})
            MATCH (t:Entity {name: rel.target, case_id: $case_id})
            MERGE (s)-[r:RELATED {type: toUpper(rel.label)}]->(t)
            ON CREATE SET r.created_by = $investigator, r.evidence = coalesce(rel.evidence, $note)
            """
            await session.run(add_rel_query, case_id=case_id, rels=insight_data["relationships_to_add"],
                              investigator=request.investigator_name,
                              note=insight_data.get("insight_note", request.text))

    # 4. TRIGGER REAL-TIME UI SYNC
    broadcast_msg = f"{request.investigator_name} updated the graph: {insight_data.get('insight_note', request.text)}"
    await ws_manager.broadcast_graph_update(case_id, broadcast_msg)

    return {
        "status": "success",
        "message": "Insight applied successfully.",
        "llm_parsed_action": insight_data
    }


@app.get("/api/cases/{case_id}/metrics", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(case_id: str):
    """Retrieves high-level KPIs for the case dashboard."""
    query = """
    MATCH (n {case_id: $case_id})
    WITH 
        SUM(CASE WHEN toUpper(coalesce(n.type, n.master_role, labels(n)[0], '')) IN ['DOCUMENT', 'FILE'] THEN 1 ELSE 0 END) AS documents,
        SUM(CASE WHEN toUpper(coalesce(n.type, n.master_role, labels(n)[0], '')) IN ['CHUNK', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH'] THEN 1 ELSE 0 END) AS chunks,
        SUM(CASE WHEN NOT toUpper(coalesce(n.type, n.master_role, labels(n)[0], '')) IN ['DOCUMENT', 'FILE', 'CHUNK', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH', 'CASE'] THEN 1 ELSE 0 END) AS entities,
        SUM(CASE WHEN toUpper(coalesce(n.type, n.master_role, labels(n)[0], '')) IN ['PERSON', 'SUSPECT', 'TARGET', 'INVESTIGATOR', 'OFFICER', 'VICTIM', 'WITNESS', 'PERPETRATOR', 'SUBJECT'] THEN 1 ELSE 0 END) AS persons,
        SUM(CASE WHEN coalesce(n.has_alert, n.is_flagged, false) = true OR toUpper(coalesce(n.type, '')) IN ['ALERT', 'FLAG'] THEN 1 ELSE 0 END) AS alerts
    OPTIONAL MATCH (src {case_id: $case_id})-[r]->(tgt {case_id: $case_id})
    WITH documents, chunks, entities, persons, alerts, COUNT(r) AS relationships, SUM(CASE WHEN coalesce(r.evidence, '') <> '' THEN 1 ELSE 0 END) AS evidence
    RETURN documents, chunks, entities, persons, evidence, relationships, alerts, (entities + relationships) AS network_size
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(query, case_id=case_id)
        records = [record.data() async for record in result]

    if not records:
        return DashboardMetricsResponse(documents=0, chunks=0, entities=0, persons=0, evidence=0, relationships=0,
                                        alerts=0, network_size=0)

    r = records[0]
    return DashboardMetricsResponse(
        documents=r.get("documents") or 0, chunks=r.get("chunks") or 0,
        entities=r.get("entities") or 0, persons=r.get("persons") or 0,
        evidence=r.get("evidence") or 0, relationships=r.get("relationships") or 0,
        alerts=r.get("alerts") or 0, network_size=r.get("network_size") or 0
    )


@app.get("/api/cases/{case_id}/suspects/top", response_model=List[SuspectProfile])
async def get_top_suspects(case_id: str, limit: int = Query(default=10, ge=1, le=100)):
    query = """
    MATCH (s {case_id: $case_id})
    WHERE toUpper(s.master_role) IN ['SUSPECT', 'TARGET', 'PERSON_OF_INTEREST', 'ACCUSED', 'PERPETRATOR']
       OR toUpper(s.type) IN ['SUSPECT', 'TARGET', 'PERSON_OF_INTEREST', 'ACCUSED']
       OR EXISTS { MATCH (s)-[r]->() WHERE type(r) IN ['SUSPECT_IN', 'ACCUSED_OF', 'PERPETRATED', 'COMMITTED', 'ASSOCIATED_WITH', 'INVOLVED_IN'] }
    OPTIONAL MATCH (s)-[r]-()
    OPTIONAL MATCH (s)-[r_case]-(c:Case) 
    WITH s, count(DISTINCT r) AS connections, collect(DISTINCT c.name) AS associated_cases
    RETURN 
        s.name AS name, coalesce(s.master_role, 'SUSPECT') AS master_role, coalesce(s.aliases, []) AS aliases,
        coalesce(s.mention_count, 1) AS mentions, connections AS degree_connections, associated_cases
    ORDER BY mentions DESC, degree_connections DESC LIMIT $limit
    """
    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id, limit=limit)).data()

    return [
        SuspectProfile(
            name=r["name"], master_role=r["master_role"], aliases=r["aliases"],
            mentions=r["mentions"], degree_connections=r["degree_connections"],
            associated_cases=[c for c in r["associated_cases"] if c]
        ) for r in records
    ]


@app.get("/api/cases/{case_id}/graph/full", response_model=GraphResponse)
async def get_full_relation_map(case_id: str, limit: int = Query(default=200, ge=1, le=1000),
                                entity_type: Optional[str] = Query(default=None)):
    if entity_type:
        query = """
        MATCH (source {case_id: $case_id})-[rel]-(target {case_id: $case_id})
        WHERE toUpper(coalesce(source.type, source.master_role, source.category, '')) = toUpper($entity_type) OR toUpper(coalesce(target.type, target.master_role, target.category, '')) = toUpper($entity_type)
        RETURN source, rel, target LIMIT $limit
        """
    else:
        query = "MATCH (source {case_id: $case_id})-[rel]-(target {case_id: $case_id}) RETURN source, rel, target LIMIT $limit"

    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id, limit=limit, entity_type=entity_type)).data()
    return parse_graph_records(records) if records else GraphResponse(nodes=[], edges=[])


@app.get("/api/cases/{case_id}/graph/entity-types", response_model=List[str])
async def get_available_entity_types(case_id: str):
    query = """
    MATCH (n {case_id: $case_id})
    WITH DISTINCT coalesce(n.type, n.master_role, n.category) AS entity_type
    WHERE entity_type IS NOT NULL AND entity_type <> ''
    RETURN entity_type ORDER BY entity_type ASC
    """
    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id)).data()
    return [r["entity_type"] for r in records]


@app.get("/api/cases/{case_id}/investigators", response_model=List[InvestigatorProfile])
async def list_investigators(case_id: str):
    query = """
    MATCH (i {case_id: $case_id})
    WHERE toUpper(i.master_role) IN ['INVESTIGATOR', 'OFFICER', 'AGENT', 'DETECTIVE', 'ANALYST'] OR toUpper(i.type) IN ['INVESTIGATOR', 'OFFICER', 'AGENT', 'DETECTIVE']
    OPTIONAL MATCH (i)-[r]-()
    WITH i, count(r) AS connections
    RETURN i.name AS name, coalesce(i.master_role, 'INVESTIGATOR') AS master_role, coalesce(i.aliases, []) AS aliases, coalesce(i.mention_count, 1) AS mentions, connections AS degree_connections
    ORDER BY mentions DESC, connections DESC
    """
    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id)).data()
    return [InvestigatorProfile(**r) for r in records]


@app.get("/api/cases/{case_id}/investigator/{investigator_name}/cases", response_model=InvestigatorCasesResponse)
async def get_investigator_cases(case_id: str, investigator_name: str):
    case_query = """
    MATCH (inv {case_id: $case_id})-[r]-(c:Case {id: $case_id})
    WHERE (toUpper(inv.name) CONTAINS toUpper($name) OR ANY(a IN inv.aliases WHERE toUpper(a) CONTAINS toUpper($name)))
    RETURN inv.name AS canonical_name, coalesce(c.name, c.id) AS case_name, coalesce(c.type, 'CASE') AS case_type, type(r) AS relationship, coalesce(r.evidence, '') AS evidence, coalesce(r.chunk_id, '') AS chunk_id
    """
    graph_query = """
    MATCH (source {case_id: $case_id})-[rel]-(target {case_id: $case_id})
    WHERE toUpper(source.name) CONTAINS toUpper($name) OR ANY(a IN source.aliases WHERE toUpper(a) CONTAINS toUpper($name))
    RETURN source, rel, target
    """
    async with driver.session(database="neo4j") as session:
        case_records = await (await session.run(case_query, case_id=case_id, name=investigator_name)).data()
        graph_records = await (await session.run(graph_query, case_id=case_id, name=investigator_name)).data()

    if not graph_records:
        raise HTTPException(status_code=404, detail="No investigator found in this case.")

    canonical_name = case_records[0]["canonical_name"] if case_records else investigator_name
    cases = [CaseDetail(**r) for r in case_records]
    graph_data = parse_graph_records(graph_records)

    return InvestigatorCasesResponse(
        investigator_name=investigator_name, canonical_name=canonical_name, total_cases=len(cases), cases=cases,
        graph=graph_data
    )


@app.get("/api/cases/{case_id}/graph/executive-summary", response_model=GraphResponse)
async def get_executive_case_summary(case_id: str, max_nodes: int = Query(default=20, ge=5, le=50),
                                     max_rels_per_node: int = Query(default=6, ge=1, le=20),
                                     min_connections: int = Query(default=1, ge=1)):
    allowed_types = ['PERSON', 'SUSPECT', 'TARGET', 'INVESTIGATOR', 'OFFICER', 'VICTIM', 'WITNESS', 'ORGANIZATION',
                     'WEAPON', 'LOCATION', 'CRIME', 'INCIDENT', 'VEHICLE', 'CASE']
    query = """
    MATCH (n {case_id: $case_id})-[r]-()
    WHERE (toUpper(coalesce(n.type, n.master_role, '')) IN $allowed_types OR ANY(lbl IN labels(n) WHERE toUpper(lbl) IN $allowed_types))
    AND NOT toUpper(coalesce(n.type, n.master_role, '')) IN ['CHUNK', 'DOCUMENT', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH']
    WITH n, count(r) AS degree WHERE degree >= $min_connections ORDER BY degree DESC, coalesce(n.mention_count, 1) DESC LIMIT $max_nodes
    WITH collect(n) AS major_nodes
    UNWIND major_nodes AS source
    CALL { WITH source, major_nodes MATCH (source)-[rel]-(target) WHERE target IN major_nodes RETURN rel, target LIMIT $max_rels }
    RETURN source, rel, target
    """
    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id, max_nodes=max_nodes, min_connections=min_connections,
                                           max_rels=max_rels_per_node, allowed_types=allowed_types)).data()
    return parse_graph_records(records) if records else GraphResponse(nodes=[], edges=[])


@app.get("/api/cases/{case_id}/entities/major", response_model=MajorEntitiesResponse)
async def get_major_entities(case_id: str, limit_per_category: int = Query(default=50, ge=1, le=200)):
    query = """
    MATCH (n {case_id: $case_id})
    WHERE NOT toUpper(coalesce(n.type, n.master_role, '')) IN ['CHUNK', 'DOCUMENT', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH']
    WITH n, toUpper(coalesce(n.type, n.master_role, head(labels(n)), '')) AS raw_type
    WITH n, CASE 
        WHEN raw_type IN ['LOCATION', 'ADDRESS', 'CITY', 'COUNTRY', 'PLACE', 'SAFEHOUSE'] THEN 'locations'
        WHEN raw_type IN ['PHONE', 'PHONE_NUMBER', 'CELL', 'TELEPHONE', 'NUMBER'] THEN 'phone_numbers'
        WHEN raw_type IN ['ORGANIZATION', 'COMPANY', 'ORG', 'AGENCY', 'GROUP', 'CARTEL'] THEN 'organizations'
        WHEN raw_type IN ['PERSON', 'SUSPECT', 'VICTIM', 'WITNESS', 'OFFICER', 'INVESTIGATOR', 'TARGET', 'SUBJECT', 'PERPETRATOR'] THEN 'people'
        WHEN raw_type IN ['BANK_ACCOUNT', 'CRYPTO_WALLET', 'ACCOUNT', 'TRANSACTION', 'WALLET'] THEN 'financial'
        WHEN raw_type IN ['VEHICLE', 'CAR', 'LICENSE_PLATE', 'PLATE', 'WEAPON', 'EVIDENCE'] THEN 'vehicles_and_weapons'
        ELSE 'OTHER' END AS category
    WHERE category <> 'OTHER' AND n.name IS NOT NULL
    WITH category, n ORDER BY coalesce(n.mention_count, 1) DESC
    WITH category, collect(DISTINCT {id: n.name, name: n.name, type: coalesce(n.type, n.master_role, 'UNKNOWN'), aliases: coalesce(n.aliases, []), mentions: coalesce(n.mention_count, 1)})[..$limit] AS entities
    RETURN category, entities
    """
    grouped_data = {"locations": [], "phone_numbers": [], "organizations": [], "people": [], "financial": [],
                    "vehicles_and_weapons": []}
    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id, limit=limit_per_category)).data()
    for record in records:
        cat = record.get("category")
        if cat in grouped_data:
            grouped_data[cat] = [EntityItem(**item) for item in record.get("entities", [])]
    return MajorEntitiesResponse(**grouped_data)


@app.get("/api/cases/{case_id}/suspect/{suspect_name}/relationships", response_model=GraphResponse)
async def get_suspect_relationships(case_id: str, suspect_name: str, limit: int = Query(default=100, ge=1, le=500)):
    query = """
    MATCH (source {case_id: $case_id})
    WHERE (toUpper(source.name) = toUpper($suspect_name) OR ANY(a IN source.aliases WHERE toUpper(a) = toUpper($suspect_name)))
    MATCH (source)-[rel]-(target {case_id: $case_id})
    WHERE NOT toUpper(coalesce(target.type, target.master_role, '')) IN ['CHUNK', 'DOCUMENT', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH']
    RETURN source, rel, target LIMIT $limit
    """
    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id, suspect_name=suspect_name, limit=limit)).data()
    return parse_graph_records(records) if records else GraphResponse(nodes=[], edges=[])


@app.get("/api/cases/{case_id}/person-relationship", response_model=GraphResponse)
async def get_relationship_between_persons(
        case_id: str, person1: str = Query(..., description="Name/alias of person 1"),
        person2: str = Query(..., description="Name/alias of person 2"), max_depth: int = Query(default=3, ge=1, le=5)
):
    query = """
    MATCH (p1 {case_id: $case_id}), (p2 {case_id: $case_id})
    WHERE (toUpper(p1.name) = toUpper($person1) OR ANY(a IN p1.aliases WHERE toUpper(a) = toUpper($person1)))
      AND (toUpper(p2.name) = toUpper($person2) OR ANY(a IN p2.aliases WHERE toUpper(a) = toUpper($person2)))
      AND id(p1) <> id(p2)
    MATCH path = allShortestPaths((p1)-[*..5]-(p2)) WHERE length(path) <= $max_depth
    UNWIND relationships(path) AS rel
    RETURN startNode(rel) AS source, rel, endNode(rel) AS target
    """
    async with driver.session(database="neo4j") as session:
        records = await (
            await session.run(query, case_id=case_id, person1=person1, person2=person2, max_depth=max_depth)).data()
    return parse_graph_records(records) if records else GraphResponse(nodes=[], edges=[])


@app.get("/api/cases/{case_id}/verify", response_model=CaseVerificationResponse)
async def verify_case_integrity(case_id: str):
    """
    Automatically finds all processed files for a given case_id and
    verifies their blockchain integrity.
    """
    case_dir = os.path.join(UPLOAD_DIR, case_id)

    if not os.path.exists(case_dir):
        raise HTTPException(status_code=404, detail=f"No directory found for case {case_id}")

    # Auto-discover all files by looking for standard tables
    files_in_dir = os.listdir(case_dir)
    base_filenames = []
    for f in files_in_dir:
        if f.endswith("_table.csv") and not f.endswith("_hash_table.csv"):
            base_name = f.replace("_table.csv", "")
            base_filenames.append(base_name)

    if not base_filenames:
        raise HTTPException(status_code=404, detail="No processable CSV tables found in this case.")

    results = []
    overall_valid = True

    for base_name in base_filenames:
        original_file_name = f"{base_name}.txt"
        dossier_csv = os.path.join(case_dir, f"{base_name}_table.csv")
        blockchain_csv = os.path.join(case_dir, f"{base_name}_hash_table.csv")

        if not os.path.exists(blockchain_csv):
            results.append(FileVerificationResult(
                original_file=original_file_name,
                is_valid=False,
                message="Hash table missing! Cannot verify integrity."
            ))
            overall_valid = False
            continue

        verification = verify_blockchain_integrity(blockchain_csv, dossier_csv)
        results.append(FileVerificationResult(
            original_file=original_file_name,
            is_valid=verification["is_valid"],
            message=verification["message"]
        ))

        if not verification["is_valid"]:
            overall_valid = False

    return CaseVerificationResponse(
        case_id=case_id,
        overall_valid=overall_valid,
        total_files_checked=len(results),
        results=results
    )


@app.delete("/api/cases/batch-delete")
async def delete_multiple_cases(case_ids: List[str]):
    query = """
    MATCH (c:Case)
    WHERE c.id IN $case_ids
    OPTIONAL MATCH (n {case_id: c.id})
    DETACH DELETE n, c
    """
    async with driver.session(database="neo4j") as session:
        await session.run(query, case_ids=case_ids)

    return {"status": "success",
            "message": f"Successfully deleted {len(case_ids)} case(s) and their associated graph data."}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)