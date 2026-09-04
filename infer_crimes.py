from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "cricket@123"
DATABASE = "chunktest"

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

query = '''
MATCH (a:Entity)-[r]->()
WHERE NOT type(r) IN ['HAS_DOCUMENT', 'HAS_CHUNK', 'NEXT', 'MENTIONS', 'BELONGS_TO']
WITH a, collect(DISTINCT type(r)) AS crimes
MATCH (b:Entity)-[r2]->()
WHERE NOT type(r2) IN ['HAS_DOCUMENT', 'HAS_CHUNK', 'NEXT', 'MENTIONS', 'BELONGS_TO']
  AND elementId(a) < elementId(b)
WITH a, b, crimes, collect(DISTINCT type(r2)) AS crimes_b
WITH a, b, 
     [x IN crimes WHERE x IN crimes_b] AS common_crimes,
     crimes, crimes_b
WHERE size(common_crimes) >= 1
MERGE (a)-[sim:INFERRED_SIMILAR_CRIME]->(b)
SET sim.inferred = true,
    sim.evidence = "Inferred based on similar relationships.",
    sim.common_crimes = common_crimes,
    sim.score = toFloat(size(common_crimes)) / (size(crimes) + size(crimes_b) - size(common_crimes)),
    sim.chunk_ids = [],
    sim.chunk_text = "System Inferred Connection"
'''
with driver.session(database=DATABASE) as session:
    result = session.run(query)

print("Inferred connections generated in Neo4j.")
