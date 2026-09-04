"""
drishyam_ingest.py
==================
Ingests the Drishyam (CASE_A14047AB) case data into the Neo4j `chunktest` database.

Graph model:
  OG Node Graph : (:Entity) -[:RELATIONSHIP {evidence, chunk_id, chunk_text}]-> (:Entity)
  Hypergraph    : (:Entity) -[:INVOLVED_IN]-> (:HyperEvent {event_type, chunk_text})

Chunk text is embedded as a property on Entity nodes (NOT as separate Chunk nodes),
so the React sidebar can display it on node-click without extra graph complexity.
"""

import json
import os
from neo4j import GraphDatabase

# ── Config ──────────────────────────────────────────────────────────────────
CASE_DIR    = os.path.join(os.path.dirname(__file__), "uploaded_cases", "CASE_A14047AB")
NEO4J_URI   = "bolt://localhost:7687"
NEO4J_USER  = "neo4j"
NEO4J_PASS  = "cricket@123"
NEO4J_DB    = "chunktest"

CHUNKS_FILE     = os.path.join(CASE_DIR, "drishyam_step1_chunks.json")
RESOLVED_FILE   = os.path.join(CASE_DIR, "drishyam_step4_resolved.json")
TRIPLETS_FILE   = os.path.join(CASE_DIR, "drishyam_step3_triplets.json")
HYPERGRAPH_FILE = os.path.join(CASE_DIR, "CASE_A14047AB_hypergraph.json")

CASE_ID   = "CASE_A14047AB"
CASE_NAME = "Drishyam"

# ── Load files ────────────────────────────────────────────────────────────────
print("[1/6] Loading JSON files...")
with open(CHUNKS_FILE,     encoding="utf-8") as f: chunks_data     = json.load(f)
with open(RESOLVED_FILE,   encoding="utf-8") as f: resolved_data   = json.load(f)
with open(TRIPLETS_FILE,   encoding="utf-8") as f: triplets_data   = json.load(f)
with open(HYPERGRAPH_FILE, encoding="utf-8") as f: hypergraph_data = json.load(f)

chunk_text_map = {c["chunk_id"]: c["text"] for c in chunks_data}

# ── Map entities to their source chunks ──────────────────────────────────────
print("[2/6] Mapping entities to their source chunks...")
entity_chunks = {}
for chunk_entry in triplets_data:
    cid = chunk_entry["chunk_id"]
    for ent in chunk_entry.get("entities", []):
        name = ent["name"].strip()
        entity_chunks.setdefault(name, set()).add(cid)

alias_to_canonical = {}
canonical_entities = []

for ent in resolved_data["entities"]:
    canonical = ent["canonical_name"].strip()
    etype     = ent.get("entity_type", "UNKNOWN")
    role      = ent.get("master_role", etype)
    mentions  = ent.get("mention_count", 1)
    aliases   = [a.strip() for a in ent.get("aliases", [])]

    alias_to_canonical[canonical.lower()] = canonical
    for a in aliases:
        alias_to_canonical[a.lower()] = canonical

    source_chunks = []
    seen_chunks = set()
    for nm in [canonical] + aliases:
        for cid in entity_chunks.get(nm, set()):
            if cid not in seen_chunks:
                seen_chunks.add(cid)
                source_chunks.append({"chunk_id": cid, "text": chunk_text_map.get(cid, "")})

    canonical_entities.append({
        "canonical_name": canonical,
        "entity_type":    etype,
        "master_role":    role,
        "aliases":        aliases,
        "mention_count":  mentions,
        "source_chunks":  json.dumps(source_chunks)
    })

print(f"  -> {len(canonical_entities)} canonical entities ready.")

# ── Build flat triplets list ──────────────────────────────────────────────────
flat_triplets = []
for chunk_entry in triplets_data:
    cid   = chunk_entry["chunk_id"]
    ctext = chunk_text_map.get(cid, "")
    for t in chunk_entry.get("triplets", []):
        flat_triplets.append({
            "subject":    t.get("subject",   "").strip(),
            "predicate":  t.get("predicate", "RELATED_TO").strip().upper(),
            "object":     t.get("object",    "").strip(),
            "evidence":   t.get("evidence",  ""),
            "chunk_id":   cid,
            "chunk_text": ctext
        })

print(f"  -> {len(flat_triplets)} triplets extracted.")

# ── Connect to Neo4j ──────────────────────────────────────────────────────────
print("[3/6] Connecting to Neo4j...")
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

with driver.session(database=NEO4J_DB) as sess:

    print("[4/6] Clearing chunktest database...")
    sess.run("MATCH (n) DETACH DELETE n")

    try:
        sess.run("CREATE CONSTRAINT entity_name IF NOT EXISTS FOR (e:Entity) REQUIRE e.canonical_name IS UNIQUE")
    except Exception:
        pass
    try:
        sess.run("CREATE CONSTRAINT hyper_event_id IF NOT EXISTS FOR (h:HyperEvent) REQUIRE h.event_id IS UNIQUE")
    except Exception:
        pass

    print("[5/6] Building OG node graph (Entities + Relationships)...")

    sess.run(
        "MERGE (c:Case {case_id: $cid}) SET c.case_name = $cname, c.created_at = datetime()",
        cid=CASE_ID, cname=CASE_NAME
    )

    for ent in canonical_entities:
        sess.run(
            """
            MERGE (e:Entity {canonical_name: $cn})
            SET e.entity_type   = $etype,
                e.master_role   = $role,
                e.aliases       = $aliases,
                e.mention_count = $mentions,
                e.source_chunks = $sc,
                e.case_id       = $cid
            WITH e
            MATCH (c:Case {case_id: $cid})
            MERGE (e)-[:BELONGS_TO]->(c)
            """,
            cn=ent["canonical_name"], etype=ent["entity_type"],
            role=ent["master_role"], aliases=ent["aliases"],
            mentions=ent["mention_count"], sc=ent["source_chunks"], cid=CASE_ID
        )
    print(f"  -> {len(canonical_entities)} Entity nodes created.")

    rel_count  = 0
    skip_count = 0
    for t in flat_triplets:
        subj = alias_to_canonical.get(t["subject"].lower(), t["subject"])
        obj  = alias_to_canonical.get(t["object"].lower(),  t["object"])
        pred = t["predicate"].replace(" ", "_").replace("-", "_").strip("_")
        if not subj or not obj or not pred:
            skip_count += 1
            continue
        try:
            result = sess.run(
                f"""
                MATCH (s:Entity {{canonical_name: $subj}})
                MATCH (o:Entity {{canonical_name: $obj}})
                MERGE (s)-[r:`{pred}`]->(o)
                ON CREATE SET r.evidence   = $evidence,
                              r.chunk_id   = $chunk_id,
                              r.chunk_text = $chunk_text,
                              r.predicate  = $pred
                RETURN r
                """,
                subj=subj, obj=obj,
                evidence=t["evidence"], chunk_id=t["chunk_id"],
                chunk_text=t["chunk_text"], pred=pred
            )
            if result.peek():
                rel_count += 1
            else:
                skip_count += 1
        except Exception as ex:
            skip_count += 1

    print(f"  -> {rel_count} relationships created ({skip_count} skipped).")

    print("[6/6] Building Hypergraph (HyperEvent nodes + INVOLVED_IN edges)...")
    hyper_events    = hypergraph_data.get("events", [])
    hyper_rel_count = 0

    for evt in hyper_events:
        eid          = evt["event_id"]
        etype        = evt["event_type"]
        participants = evt.get("participants", [])
        parts    = eid.split("_")
        chunk_id = "_".join(parts[2:]) if len(parts) > 2 else ""
        ctext    = chunk_text_map.get(chunk_id, "")

        sess.run(
            """
            MERGE (h:HyperEvent {event_id: $eid})
            SET h.event_type        = $etype,
                h.case_id           = $cid,
                h.chunk_id          = $chunk_id,
                h.chunk_text        = $chunk_text,
                h.participant_count = $pcount
            WITH h
            MATCH (c:Case {case_id: $cid})
            MERGE (h)-[:PART_OF]->(c)
            """,
            eid=eid, etype=etype, cid=CASE_ID,
            chunk_id=chunk_id, chunk_text=ctext, pcount=len(participants)
        )

        for pname in participants:
            canon = alias_to_canonical.get(pname.lower(), pname)
            result = sess.run(
                """
                MATCH (e:Entity {canonical_name: $canon})
                MATCH (h:HyperEvent {event_id: $eid})
                MERGE (e)-[r:INVOLVED_IN]->(h)
                SET r.event_type = $etype
                RETURN r
                """,
                canon=canon, eid=eid, etype=etype
            )
            if result.peek():
                hyper_rel_count += 1

    print(f"  -> {len(hyper_events)} HyperEvent nodes created.")
    print(f"  -> {hyper_rel_count} INVOLVED_IN relationships created.")

driver.close()

print("\n SUCCESS: Drishyam graph ingestion complete!")
print(f"   DB        : {NEO4J_DB}")
print(f"   Case      : {CASE_ID} ({CASE_NAME})")
print(f"   Entities  : {len(canonical_entities)}")
print(f"   Rel count : {rel_count}")
print(f"   HyperEvts : {len(hyper_events)}")
print(f"   HyperRels : {hyper_rel_count}")
