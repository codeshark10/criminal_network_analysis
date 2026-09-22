import csv
import io
import json
import re
from typing import Dict, List
from ollama import AsyncClient


# -------------------------------------------------------------------
# 1. DATABASE SCHEMA INTROSPECTION
# -------------------------------------------------------------------
async def get_existing_schema(driver, case_id: str) -> Dict[str, List[str]]:
    """Fetches existing entity and relationship types in the case to maintain consistency."""
    node_types, rel_types = [], []

    async with driver.session(database="neo4j") as session:
        # Fetch active Node Types
        res_nodes = await session.run(
            "MATCH (n:Entity {case_id: $case_id}) RETURN DISTINCT n.type AS type LIMIT 50",
            case_id=case_id
        )
        for record in await res_nodes.data():
            if record.get("type"):
                node_types.append(record["type"])

        # Fetch active Relationship Types
        res_rels = await session.run(
            "MATCH (n:Entity {case_id: $case_id})-[r]->() RETURN DISTINCT type(r) AS type LIMIT 50",
            case_id=case_id
        )
        for record in await res_rels.data():
            if record.get("type"):
                rel_types.append(record["type"])

    return {"entity_types": list(set(node_types)), "relationship_types": list(set(rel_types))}


# -------------------------------------------------------------------
# 2. AI DYNAMIC MULTI-ENTITY SCHEMA MAPPING
# -------------------------------------------------------------------
async def get_dynamic_csv_schema(headers: List[str], sample_row: Dict[str, str], existing_schema: Dict[str, List[str]],
                                 filename: str) -> dict:
    """Uses Gemma2:9b to extract all entities and relationships present in arbitrary CSV headers."""

    prompt = f"""
You are an expert Forensic Graph Database Architect. Map EVERY entity and relationship present in a single CSV row of '{filename}' into a Neo4j Knowledge Graph.

CSV Headers: {headers}
Sample Row Data: {json.dumps(sample_row)}

Existing Entity Types in Database: {existing_schema['entity_types']}
Existing Relationship Types in Database: {existing_schema['relationship_types']}

CRITICAL INSTRUCTIONS:
1. IDENTIFY ALL ENTITIES: Extract all distinct entities in a single row.
   - Example: If a row has 'caller_person_name' AND 'caller_phone_number', create SEPARATE nodes for BOTH the Person and the Phone!
   - Do NOT collapse multiple entities into one node.

2. MAP RELATIONSHIPS: Define all logical directed relationships between these entities.
   - Example: Link caller_person_name to receiver_person_name (e.g., COMMUNICATED_WITH or CALLED).
   - Example: Link caller_person_name to caller_phone_number (e.g., HAS_PHONE or OWNS).
   - Example: Link receiver_person_name to receiver_phone_number (e.g., HAS_PHONE or OWNS).

3. SCHEMA CONSISTENCY:
   - Prefer reusing existing Entity Types ({existing_schema['entity_types']}) and Relationship Types ({existing_schema['relationship_types']}) if semantically appropriate.
   - Node default_type MUST be UPPERCASE (e.g., PERSON, PHONE, BANK, LOCATION, DOCUMENT, VEHICLE).
   - Relationship relationship_type MUST be UPPERCASE_SNAKE_CASE (e.g., COMMUNICATED_WITH, HAS_PHONE, TRANSFERRED_FUNDS_TO, SPOTTED_AT).

4. MAIN INTERACTION:
   - Set "is_main_interaction": true on the primary action relationship (e.g., COMMUNICATED_WITH) so metadata (timestamp, duration, cell area) attaches to it.

Return ONLY a raw JSON dictionary (no markdown, no backticks, no extra text).
Format strictly like this JSON template:
{{
  "nodes": [
    {{
      "node_id": "caller_person",
      "identifier_column": "caller_person_name",
      "name_column": "caller_person_name",
      "default_type": "PERSON"
    }},
    {{
      "node_id": "caller_phone",
      "identifier_column": "caller_phone_number",
      "name_column": "caller_phone_number",
      "default_type": "PHONE"
    }}
  ],
  "relationships": [
    {{
      "source_node_id": "caller_person",
      "target_node_id": "caller_phone",
      "relationship_type": "HAS_PHONE",
      "is_main_interaction": false
    }}
  ]
}}
"""
    try:
        client = AsyncClient(host="http://127.0.0.1:11434")
        response = await client.chat(
            model="gemma2:9b",
            messages=[{"role": "user", "content": prompt}],
            format="json",
            options={"temperature": 0.0}
        )

        content = response.get("message", {}).get("content", "{}").strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()

        mapping = json.loads(content)
        if not mapping.get("nodes"):
            raise ValueError("LLM returned empty nodes array.")

        return mapping
    except Exception as e:
        print(f"[ERROR] AI Mapping Failed: {e}. Falling back to default single-node schema.")
        return {
            "nodes": [{
                "node_id": "n1",
                "identifier_column": headers[0],
                "name_column": headers[0],
                "default_type": "ENTITY"
            }],
            "relationships": []
        }


# -------------------------------------------------------------------
# 3. UNIVERSAL MULTI-ENTITY CYPHER COMPILER
# -------------------------------------------------------------------
async def ingest_csv(driver, case_id: str, file_contents: bytes, filename: str, batch_size: int = 1000) -> int:
    """Reads CSV, queries AI for multi-entity graph mapping, compiles dynamic Cypher, and ingests batch data."""
    decoded = file_contents.decode("utf-8-sig", errors="ignore")
    raw_stream = io.StringIO(decoded)

    raw_reader = csv.reader(raw_stream)
    try:
        raw_headers = next(raw_reader)
    except StopIteration:
        raise ValueError("Uploaded CSV file is empty.")

    clean_headers = [str(h).strip() for h in raw_headers]
    raw_stream.seek(0)
    next(raw_stream)
    reader = list(csv.DictReader(raw_stream, fieldnames=clean_headers))

    if not reader:
        raise ValueError("Uploaded CSV file contains no data rows.")

    # 1. Introspect DB schema and generate AI mapping
    existing_schema = await get_existing_schema(driver, case_id)
    schema = await get_dynamic_csv_schema(clean_headers, reader[0], existing_schema, filename)
    print(f"\n[INFO] AI Multi-Entity Mapping for {filename}:\n{json.dumps(schema, indent=2)}")

    # 2. Compile Dynamic Cypher Query
    cypher_parts = ["MERGE (c:Case {id: $case_id}) WITH c UNWIND $batch AS row"]
    used_id_cols = set()

    # Map original node IDs to sanitized Cypher variable names
    node_id_map = {}
    for node in schema.get("nodes", []):
        raw_nid = node["node_id"]
        safe_nid = re.sub(r'[^a-zA-Z0-9_]', '_', raw_nid)
        node_id_map[raw_nid] = safe_nid

    # Generate Node Ingestion Logic
    for node in schema.get("nodes", []):
        raw_nid = node["node_id"]
        nid = node_id_map[raw_nid]
        id_col = node["identifier_column"]
        name_col = node.get("name_column")
        def_type = node.get("default_type", "ENTITY").upper()

        used_id_cols.add(id_col)
        if name_col:
            used_id_cols.add(name_col)

        name_expr = f"coalesce(row.`{name_col}`, row.`{id_col}`)" if name_col in clean_headers else f"row.`{id_col}`"

        cypher_parts.append(f"""
        FOREACH (_ IN CASE WHEN row.`{id_col}` IS NOT NULL AND trim(toString(row.`{id_col}`)) <> '' THEN [1] ELSE [] END |
            MERGE ({nid}:Entity {{identifier: row.`{id_col}`, case_id: $case_id}})
            ON CREATE SET {nid}.created_at = datetime()
            MERGE ({nid})-[:BELONGS_TO]->(c)
            SET {nid}.type = '{def_type}', {nid}.name = {name_expr}
        )
        """)

    # Generate Relationship Ingestion Logic
    for idx, rel in enumerate(schema.get("relationships", [])):
        raw_src = rel["source_node_id"]
        raw_tgt = rel["target_node_id"]

        src = node_id_map.get(raw_src, re.sub(r'[^a-zA-Z0-9_]', '_', raw_src))
        tgt = node_id_map.get(raw_tgt, re.sub(r'[^a-zA-Z0-9_]', '_', raw_tgt))

        rel_raw = rel.get("relationship_type", "RELATED_TO")
        r_type = re.sub(r'[^A-Z_]', '', rel_raw.upper().replace(" ", "_")) or "RELATED_TO"
        is_main = rel.get("is_main_interaction", False)

        rel_var = f"r_{src}_{tgt}_{idx}"
        prop_setter = f"SET {rel_var} += row._props" if is_main else ""

        src_node = next((n for n in schema["nodes"] if n["node_id"] == raw_src), None)
        tgt_node = next((n for n in schema["nodes"] if n["node_id"] == raw_tgt), None)

        if src_node and tgt_node:
            s_col = src_node["identifier_column"]
            t_col = tgt_node["identifier_column"]

            cypher_parts.append(f"""
            FOREACH (_ IN CASE WHEN row.`{s_col}` IS NOT NULL AND trim(toString(row.`{s_col}`)) <> '' AND row.`{t_col}` IS NOT NULL AND trim(toString(row.`{t_col}`)) <> '' THEN [1] ELSE [] END |
                MERGE ({src}:Entity {{identifier: row.`{s_col}`, case_id: $case_id}})
                MERGE ({tgt}:Entity {{identifier: row.`{t_col}`, case_id: $case_id}})
                MERGE ({src})-[{rel_var}:{r_type} {{case_id: $case_id}}]->({tgt})
                {prop_setter}
            )
            """)

    query = "\n".join(cypher_parts)
    print(f"\n[DEBUG] Compiled Dynamic Cypher Query:\n{query}")

    # 3. Batch Execute Query
    rows_to_insert = []
    total_processed = 0

    async with driver.session(database="neo4j") as session:
        for row in reader:
            # Gather metadata properties (all columns NOT used as identifiers)
            props = {k: str(v).strip() for k, v in row.items() if k not in used_id_cols and k is not None}
            props["source_file"] = filename

            row_dict = {k: str(v).strip() for k, v in row.items() if k is not None}
            row_dict["_props"] = props

            rows_to_insert.append(row_dict)

            if len(rows_to_insert) >= batch_size:
                await session.run(query, case_id=case_id, batch=rows_to_insert)
                total_processed += len(rows_to_insert)
                rows_to_insert = []

        if rows_to_insert:
            await session.run(query, case_id=case_id, batch=rows_to_insert)
            total_processed += len(rows_to_insert)

    return total_processed