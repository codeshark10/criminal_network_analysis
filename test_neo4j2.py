from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "cricket@123"
DATABASE = "chunktest"

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

query = '''
MATCH (a)-[r:PARTICIPATED_IN|INVOLVED_IN|VICTIM_OF]->(b)
RETURN a.type, type(r), b.type, b.name LIMIT 20
'''
with driver.session(database=DATABASE) as session:
    result = session.run(query)
    for r in result:
        print(r['a.type'], r['type(r)'], r['b.type'], r['b.name'])
