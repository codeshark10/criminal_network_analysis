import asyncio
from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "cricket@123"

async def test_query():
    query = "MATCH (source {case_id: 'CASE_SILKROAD_001'})-[rel]-(target {case_id: 'CASE_SILKROAD_001'}) RETURN source.name, type(rel), target.name"
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    async with driver.session(database="chunktest") as session:
        records = await (await session.run(query)).data()
        for r in records:
            print(f"{r['source.name']} -[{r['type(rel)']}]-> {r['target.name']}")
    await driver.close()

asyncio.run(test_query())
