from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "cricket@123"
DATABASE = "chunktest"

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

query = '''
MERGE (c:Case {id: 'CASE_A14047AB'})
SET c.name = 'Drishyam Case', c.status = 'ACTIVE'
WITH c
MATCH (e:Entity)
MERGE (e)-[:BELONGS_TO]->(c)
SET e.case_id = 'CASE_A14047AB'
'''
with driver.session(database=DATABASE) as session:
    session.run(query)

print("Case node created and linked.")
