from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "cricket@123"
DATABASE = "chunktest"

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

query = '''
MATCH (p1:Entity)-[r1]->(t1)
MATCH (p2:Entity)-[r2]->(t2)
WHERE id(p1) < id(p2) 
  AND type(r1) = type(r2)
  AND type(r1) IN ['INVOLVED_IN', 'PARTICIPATED_IN']
MERGE (p1)-[inf:INFERRED_SIMILAR_CRIME]->(p2)
ON CREATE SET inf.inferred = true, inf.crime_type = type(r1), inf.weight = 1
ON MATCH SET inf.weight = inf.weight + 1, inf.crime_type = inf.crime_type + ", " + type(r1)
RETURN count(inf) as created_inferences
'''

with driver.session(database=DATABASE) as session:
    result = session.run(query)
    count = result.single()["created_inferences"]
    print(f"Created {count} inferred similar crime connections.")
