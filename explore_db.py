from neo4j import GraphDatabase
import json

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "cricket@123"
DATABASE = "chunktest"

try:
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    with driver.session(database=DATABASE) as session:
        # Get all distinct relationship types
        rel_types = session.run("MATCH ()-[r]->() RETURN DISTINCT type(r) AS rel_type").value()
        
        print("RELATIONSHIP TYPES:")
        for r in rel_types:
            print("- " + r)
            
        print("\nSAMPLE CRIME/INCIDENT RELATIONSHIPS:")
        # Try to find relationships that sound like crimes (e.g. MURDER, ASSAULT, INVOLVED_IN)
        # Or let's just get a sample of Entity relationships
        q = "MATCH (a:Entity)-[r]->(b:Entity) RETURN a.type, type(r), b.type, count(r) as c ORDER BY c DESC LIMIT 10"
        sample = session.run(q).data()
        print(json.dumps(sample, indent=2))
        
        # Check if there are specific case nodes or crime types
        q2 = "MATCH (c:Case) RETURN c.id, c.name LIMIT 5"
        cases = session.run(q2).data()
        print("\nCASES:", json.dumps(cases, indent=2))
except Exception as e:
    print("Error:", e)
