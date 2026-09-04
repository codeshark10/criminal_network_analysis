import sys

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Update GraphEdge BaseModel
old_edge = '''class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    evidence: Optional[str] = ""
    chunk_id: Optional[str] = ""
    chunk_text: Optional[str] = ""'''

new_edge = '''class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    evidence: Optional[str] = ""
    chunk_id: Optional[str] = ""
    chunk_text: Optional[str] = ""
    inferred: bool = False'''
    
content = content.replace(old_edge, new_edge)

# Update parse_graph_records
old_parse = '''            if hasattr(rel, "type"):
                rel_type = rel.type
                evidence = dict(rel).get("evidence", "")
                chunk_id = dict(rel).get("chunk_id", "")
                chunk_text = dict(rel).get("chunk_text", "")
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

new_parse = '''            if hasattr(rel, "type"):
                rel_type = rel.type
                evidence = dict(rel).get("evidence", "")
                chunk_id = dict(rel).get("chunk_id", "")
                chunk_text = dict(rel).get("chunk_text", "")
                inferred = dict(rel).get("inferred", False)
            elif isinstance(rel, dict):
                rel_type = rel.get("type") or rel.get("label") or "RELATED"
                evidence = rel.get("evidence", "")
                chunk_id = rel.get("chunk_id", "")
                chunk_text = rel.get("chunk_text", "")
                inferred = rel.get("inferred", False)
            elif isinstance(rel, (tuple, list)):
                rel_type = str(rel[1]) if len(rel) > 1 else "RELATED"
                props = rel[2] if len(rel) > 2 and isinstance(rel[2], dict) else {}
                evidence = props.get("evidence", "")
                chunk_id = props.get("chunk_id", "")
                chunk_text = props.get("chunk_text", "")
                inferred = props.get("inferred", False)
            else:
                rel_type = "RELATED"
                evidence, chunk_id, chunk_text, inferred = "", "", "", False

            edge_id = f"{s_name}|{rel_type}|{t_name}"
            if edge_id not in seen_edges:
                seen_edges.add(edge_id)
                edges_list.append(GraphEdge(
                    id=edge_id, source=s_name, target=t_name, label=rel_type, evidence=str(evidence),
                    chunk_id=str(chunk_id), chunk_text=str(chunk_text), inferred=bool(inferred)
                ))'''

content = content.replace(old_parse, new_parse)

with open('main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched CNA_backend/main.py successfully.")
