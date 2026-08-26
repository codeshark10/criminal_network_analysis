import os
from neo4j import GraphDatabase

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "crick#21")

# Exact mapping of redundant variations to standard canonical types
RELATION_MIGRATION_MAP = {
    # Communications
    "COMMUNICATED_WITH": "COMMUNICATES_WITH",
    # Operations
    "DISCUSS_OPERATIONS": "DISCUSSES_OPERATIONS_WITH",
    "DISCUSS_OPERATIONS_WITH": "DISCUSSES_OPERATIONS_WITH",
    "DISCUSSES_OPERATIONS": "DISCUSSES_OPERATIONS_WITH",
    # Direction & Transport
    "DIRECTED": "DIRECTS",
    "DIRECTED_TRANSPORT": "DIRECTS_TRANSPORT",
    "DIRECTS_VEHICLE_USE": "DIRECTS_TRANSPORT",
    "HANDLE_TRANSPORT": "DIRECTS_TRANSPORT",
    "HANDLES_TRANSPORT": "DIRECTS_TRANSPORT",
    # Possession & Carrying
    "CARRIED": "CARRIES",
    "CARRIES_PACKAGE": "CARRIES",
    # Meetings & Visits
    "MEET_WITH": "MET_WITH",
    "ENTER": "ENTERED",
    # Movement & Locations
    "TRAVELED_TO": "TRAVELS_TO",
    "DESTINATION": "TRAVELS_TO",
    "ACTIVE_AT": "LOCATED_AT",
    "LOCATED_IN": "LOCATED_AT",
    "LOCATES": "LOCATED_AT",
    "LOCATION": "LOCATED_AT",
    "LOCATION_OF": "LOCATED_AT",
    "SPOTTED_AT": "LOCATED_AT",
    "PROXIMITY": "IN_PROXIMITY",
    "OPERATES_FROM": "OPERATES_AT",
    "OPERATES_IN": "OPERATES_AT",
    "OPERATES_NEAR": "OPERATES_AT",
    # Incident Involvement
    "OPERATION_INVOLVED": "INVOLVED_IN",
    "OPERATIONS_INVOLVED": "INVOLVED_IN",
    "OPERATIONS_RELATED_TO": "INVOLVED_IN",
    "INVOLVES": "INVOLVED_IN",
    # Financial & Transactions
    "AMOUNT": "HAS_AMOUNT",
    "HAS_TRANSACTION_AMOUNT": "HAS_AMOUNT",
    "HAS_ACCOUNT": "HAS_BANK_ACCOUNT",
    "TRANSFERRED_FUNDS": "TRANSFERRED_FUNDS_TO",
    "TRANSFERRED_TO": "TRANSFERRED_FUNDS_TO",
    "TRANSFER_FUNDS": "TRANSFERRED_FUNDS_TO",
    "TRANSFER_TO": "TRANSFERRED_FUNDS_TO",
    "TRANSFERRED_FUNDS_FROM": "RECEIVED_FUNDS_FROM",
    "REQUIRES_FUNDS": "REQUESTS_FUNDS",
    "REQUIRES_FUNDS_TRANSFER": "REQUESTS_FUNDS",
    # Vehicles & Plates
    "HAS_PLATE": "HAS_LICENSE_PLATE",
    "HAS_VEHICLE_PLATE": "HAS_LICENSE_PLATE",
    "HAS_VEHICLE": "USES_VEHICLE",
    # Flags & Associations
    "FLAGGED": "HAS_FLAG",
    "HAS_SUSPICIOUS_ACTIVITY_FLAG": "HAS_FLAG",
    "IS_RELATED_TO": "ASSOCIATED_WITH",
    "LINKED_TO": "ASSOCIATED_WITH",
    "BELONGS_TO": "REGISTERED_TO"
}


def consolidate_relationships():
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    with driver.session() as session:
        print("Starting safe relationship consolidation...")
        total_migrated = 0

        for old_type, new_type in RELATION_MIGRATION_MAP.items():
            # Merges old edges into canonical new edges, copying properties before deleting old edge
            cypher = f"""
            MATCH (a)-[r:`{old_type}`]->(b)
            MERGE (a)-[r2:`{new_type}`]->(b)
            ON CREATE SET r2 += properties(r)
            DELETE r
            RETURN count(r2) AS count
            """
            result = session.run(cypher)
            record = result.single()
            migrated_count = record["count"] if record else 0

            if migrated_count > 0:
                print(f"[✓] Successfully merged {migrated_count} edges: '{old_type}' -> '{new_type}'")
                total_migrated += migrated_count

        print(f"\nDone! Consolidated {total_migrated} total relationships into clean standard types.")

    driver.close()


if __name__ == "__main__":
    consolidate_relationships()