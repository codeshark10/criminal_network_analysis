import os
import json
import re
from collections import defaultdict
from typing import List, Dict, Any
from neo4j import GraphDatabase

class Neo4jIngestor:
    def __init__(self, uri: str = "bolt://localhost:7687", user: str = "neo4j", password: str = "crick#21"):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def ingest_data(self, case_id: str, entities: List[Dict], triplets: List[Dict]):
        with self.driver.session() as session:
            # Ensure workspace exists
            session.run("MERGE (c:Case {id: $case_id})", case_id=case_id)

            # Ingest Entities mapped to case_id
            ent_query = """
            UNWIND $batch AS row
            MERGE (e:Entity {name: row.canonical_name, case_id: $case_id})
            SET e.type = row.entity_type, e.master_role = row.master_role, 
                e.aliases = row.aliases, e.mention_count = row.mention_count
            WITH e
            MATCH (c:Case {id: $case_id})
            MERGE (e)-[:BELONGS_TO]->(c)
            """
            for i in range(0, len(entities), 500):
                session.run(ent_query, batch=entities[i:i+500], case_id=case_id)

            # Ingest Relationships mapped to case_id
            trips_by_pred = defaultdict(list)
            for t in triplets:
                pred = re.sub(r"[^A-Z0-9_]", "_", t["predicate"].upper().strip()) or "RELATED_TO"
                trips_by_pred[pred].append(t)

            for pred, batch in trips_by_pred.items():
                rel_query = f"""
                UNWIND $batch AS row
                MATCH (s:Entity {{name: row.subject, case_id: $case_id}})
                MATCH (o:Entity {{name: row.object, case_id: $case_id}})
                MERGE (s)-[r:`{pred}`]->(o)
                SET r.evidence = row.evidence, r.chunk_id = row.chunk_id, r.case_id = $case_id
                """
                for i in range(0, len(batch), 500):
                    session.run(rel_query, batch=batch[i:i+500], case_id=case_id)

def run_step5(case_id: str, input_path: str):
    print(f"\n[STEP 5] Pushing to Neo4j Database...")
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    ingestor = Neo4jIngestor()
    try:
        ingestor.ingest_data(case_id, data.get("entities", []), data.get("triplets", []))
        print(f"  ✓ Successfully ingested data to Neo4j for Case: {case_id}")
    finally:
        ingestor.close()