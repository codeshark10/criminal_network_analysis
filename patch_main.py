import re

with open('main.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Update GraphNode
text = re.sub(
    r'(class GraphNode\(BaseModel\):\n.*?mentions: int = 1\n)',
    r'\g<1>    source_chunks: Optional[str] = None\n',
    text,
    flags=re.DOTALL
)

# Update GraphEdge
text = re.sub(
    r'(class GraphEdge\(BaseModel\):\n.*?chunk_id: Optional\[str\] = ""\n)',
    r'\g<1>    chunk_text: Optional[str] = ""\n',
    text,
    flags=re.DOTALL
)

# Replace extract_node_info
old_extract = '''    def extract_node_info(node):
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
        return None'''

new_extract = '''    def extract_node_info(node):
        if not node:
            return None
        if isinstance(node, dict):
            name = node.get("name") or node.get("canonical_name")
            n_type = node.get("type") or node.get("entity_type") or node.get("master_role") or "UNKNOWN"
            role = node.get("master_role", "UNKNOWN")
            aliases = list(node.get("aliases") or [])
            mentions = node.get("mention_count") or node.get("mentions") or 1
            source_chunks = node.get("source_chunks", "[]")
            return name, n_type, role, aliases, mentions, source_chunks
        elif hasattr(node, "get"):
            name = node.get("name") or node.get("canonical_name")
            n_type = node.get("type", node.get("entity_type", node.get("master_role", "UNKNOWN")))
            role = node.get("master_role", "UNKNOWN")
            aliases = list(node.get("aliases", []))
            mentions = node.get("mention_count", 1)
            source_chunks = node.get("source_chunks", "[]")
            return name, n_type, role, aliases, mentions, source_chunks
        return None'''
text = text.replace(old_extract, new_extract)

# Update the GraphNode instantiations in parse_graph_records
old_s_node = '''            if s_name not in nodes_dict:
                nodes_dict[s_name] = GraphNode(
                    id=s_name, label=s_name, type=s_info[1], master_role=s_info[2], aliases=s_info[3],
                    mentions=s_info[4]
                )'''
new_s_node = '''            if s_name not in nodes_dict:
                nodes_dict[s_name] = GraphNode(
                    id=s_name, label=s_name, type=s_info[1], master_role=s_info[2], aliases=s_info[3],
                    mentions=s_info[4], source_chunks=s_info[5]
                )'''
text = text.replace(old_s_node, new_s_node)

old_t_node = '''            if t_name not in nodes_dict:
                nodes_dict[t_name] = GraphNode(
                    id=t_name, label=t_name, type=t_info[1], master_role=t_info[2], aliases=t_info[3],
                    mentions=t_info[4]
                )'''
new_t_node = '''            if t_name not in nodes_dict:
                nodes_dict[t_name] = GraphNode(
                    id=t_name, label=t_name, type=t_info[1], master_role=t_info[2], aliases=t_info[3],
                    mentions=t_info[4], source_chunks=t_info[5]
                )'''
text = text.replace(old_t_node, new_t_node)

# Update GraphEdge instantiations
old_rel_block = '''            if hasattr(rel, "type"):
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
                ))'''

new_rel_block = '''            if hasattr(rel, "type"):
                rel_type = rel.type
                evidence = rel.get("evidence", "")
                chunk_id = rel.get("chunk_id", "")
                chunk_text = rel.get("chunk_text", "")
            elif isinstance(rel, dict):
                rel_type = rel.get("type") or rel.get("label") or "RELATED"
                evidence = rel.get("evidence", "")
                chunk_id = rel.get("chunk_id", "")
                chunk_text = rel.get("chunk_text", "")
            elif isinstance(rel, (tuple, list)):
                rel_type = str(rel[1]) if len(rel) > 1 else "RELATED"
                props = rel[2] if len(rel) > 2 and isinstance(rel[2], dict) else {}
                evidence = props.get("evidence", "")
                chunk_id = props.get("chunk_id", "")
                chunk_text = props.get("chunk_text", "")
            else:
                rel_type = "RELATED"
                evidence, chunk_id, chunk_text = "", "", ""

            edge_id = f"{s_name}|{rel_type}|{t_name}"
            if edge_id not in seen_edges:
                seen_edges.add(edge_id)
                edges_list.append(GraphEdge(
                    id=edge_id, source=s_name, target=t_name, label=rel_type, evidence=str(evidence),
                    chunk_id=str(chunk_id), chunk_text=str(chunk_text)
                ))'''
text = text.replace(old_rel_block, new_rel_block)

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Backend API Updated.")
