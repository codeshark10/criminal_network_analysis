from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "cricket@123"
DATABASE = "chunktest"

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

query = '''
MATCH (h:HyperEvent)
RETURN properties(h) LIMIT 2
'''
with driver.session(database=DATABASE) as session:
    result = session.run(query)
    for r in result:
        print(r['properties(h)'])
