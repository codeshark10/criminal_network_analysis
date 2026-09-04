from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "cricket@123"
DATABASE = "chunktest"

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

query = '''
MATCH (a)-[r:PARTICIPATED_IN|INVOLVED_IN|VICTIM_OF]->(b)
RETURN labels(a), a.name, type(r), labels(b), b.name LIMIT 10
'''
with driver.session(database=DATABASE) as session:
    result = session.run(query)
    for r in result:
        print(r['labels(a)'], r['a.name'], r['type(r)'], r['labels(b)'], r['b.name'])
