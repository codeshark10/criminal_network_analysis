import json
import os
import re
from collections import defaultdict
from typing import Dict, List, Any
from neo4j import GraphDatabase, Driver


class Neo4jIngestor:
    def __init__(
            self,
            uri: str = "bolt://localhost:7687",
            user: str = "neo4j",
            password: str = "crick#21"
    ):
        self.driver: Driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def create_constraints(self):
        """Creates unique constraints and indexes for optimized node lookup."""
        query = """
        CREATE CONSTRAINT entity_name_unique IF NOT EXISTS
        FOR (e:Entity) REQUIRE e.name IS UNIQUE
        """
        with self.driver.session() as session:
            session.run(query)
        print("✓ Created database constraints and indexes.", flush=True)

    def ingest_entities(self, entities: List[Dict[str, Any]], batch_size: int = 500):
        """Batch merges canonical entity nodes with dynamic role labels."""
        query = """
        UNWIND $batch AS row
        MERGE (e:Entity {name: row.canonical_name})
        SET e.type = row.entity_type,
            e.master_role = row.master_role,
            e.aliases = row.aliases,
            e.mention_count = row.mention_count
        WITH e, row
        CALL apoc.create.addLabels(e, [row.master_role]) YIELD node
        RETURN count(node)
        """

        # Fallback Cypher query if APOC plugin is not installed
        fallback_query = """
        UNWIND $batch AS row
        MERGE (e:Entity {name: row.canonical_name})
        SET e.type = row.entity_type,
            e.master_role = row.master_role,
            e.aliases = row.aliases,
            e.mention_count = row.mention_count
        """

        with self.driver.session() as session:
            for i in range(0, len(entities), batch_size):
                batch = entities[i:i + batch_size]
                try:
                    session.run(query, batch=batch)
                except Exception:
                    # Run standard ingestion if APOC dynamic label module is absent
                    session.run(fallback_query, batch=batch)

        print(f"✓ Successfully ingested {len(entities)} entity nodes.", flush=True)

    def ingest_triplets(self, triplets: List[Dict[str, Any]], batch_size: int = 500):
        """Groups triplets by relationship type and batch-ingests directed edges."""
        triplets_by_pred = defaultdict(list)

        for trip in triplets:
            # Sanitize predicate to guarantee valid Cypher relationship identifiers
            clean_pred = re.sub(r"[^A-Z0-9_]", "_", trip["predicate"].upper().strip())
            if not clean_pred or clean_pred[0].isdigit():
                clean_pred = "RELATED_TO"
            triplets_by_pred[clean_pred].append(trip)

        total_ingested = 0
        with self.driver.session() as session:
            for pred, trip_list in triplets_by_pred.items():
                # Dynamic relationship creation per predicate group
                rel_query = f"""
                UNWIND $batch AS row
                MATCH (s:Entity {{name: row.subject}})
                MATCH (o:Entity {{name: row.object}})
                MERGE (s)-[r:`{pred}`]->(o)
                SET r.evidence = row.evidence,
                    r.chunk_id = row.chunk_id
                """
                for i in range(0, len(trip_list), batch_size):
                    batch = trip_list[i:i + batch_size]
                    session.run(rel_query, batch=batch)
                    total_ingested += len(batch)

        print(f"✓ Successfully ingested {total_ingested} relationships across {len(triplets_by_pred)} predicate types.",
              flush=True)


def main():
    input_file = "resolved_graph.json"

    # Default connection parameters - adjust URI and credentials as needed
    NEO4J_URI = os.getenv("NEO4J_URI", "neo4j://127.0.0.1:7687")
    NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "crick#21")

    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Cannot find '{input_file}'. Ensure Step 4 completed successfully.")

    with open(input_file, "r", encoding="utf-8") as f:
        graph_data = json.load(f)

    entities = graph_data.get("entities", [])
    triplets = graph_data.get("triplets", [])

    print(f"Connecting to Neo4j instance at {NEO4J_URI}...")
    ingestor = Neo4jIngestor(uri=NEO4J_URI, user=NEO4J_USER, password=NEO4J_PASSWORD)

    try:
        ingestor.create_constraints()
        ingestor.ingest_entities(entities)
        ingestor.ingest_triplets(triplets)
        print("\n--- STEP 5 GRAPH INGESTION COMPLETE ---")
    finally:
        ingestor.close()


if __name__ == "__main__":
    main()