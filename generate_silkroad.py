from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
USER = "neo4j"
PASSWORD = "cricket@123"
DATABASE = "chunktest"

def run_ingestion():
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    
    # Generate nodes
    query = """
    MERGE (c:Case {id: 'CASE_SILKROAD_001'})
    SET c.name = 'Operation Silk Road', c.status = 'ACTIVE', c.type = 'INTERNATIONAL_SMUGGLING', c.total_entities = 35
    
    // Suspects
    MERGE (p1:Entity {name: 'Victor Petrov', case_id: 'CASE_SILKROAD_001'})
    SET p1.type = 'PERSON', p1.master_role = 'MASTERMIND', p1.aliases = ['The Tsar'], p1.mention_count = 145
    MERGE (p2:Entity {name: 'Elena Rostova', case_id: 'CASE_SILKROAD_001'})
    SET p2.type = 'PERSON', p2.master_role = 'FINANCIER', p2.aliases = ['Ice Queen'], p2.mention_count = 92
    MERGE (p3:Entity {name: 'Marcus Vance', case_id: 'CASE_SILKROAD_001'})
    SET p3.type = 'PERSON', p3.master_role = 'SMUGGLER', p3.aliases = ['Viper'], p3.mention_count = 67
    MERGE (p4:Entity {name: 'Diego Silva', case_id: 'CASE_SILKROAD_001'})
    SET p4.type = 'PERSON', p4.master_role = 'SMUGGLER', p4.aliases = ['El Gato'], p4.mention_count = 53
    MERGE (p5:Entity {name: 'Wei Chen', case_id: 'CASE_SILKROAD_001'})
    SET p5.type = 'PERSON', p5.master_role = 'HACKER', p5.aliases = ['ZeroDay'], p5.mention_count = 41
    
    // Front Companies
    MERGE (o1:Entity {name: 'Global Export Solutions', case_id: 'CASE_SILKROAD_001'})
    SET o1.type = 'ORGANIZATION', o1.master_role = 'SHELL_COMPANY', o1.mention_count = 110
    MERGE (o2:Entity {name: 'Pacific Freight Co', case_id: 'CASE_SILKROAD_001'})
    SET o2.type = 'ORGANIZATION', o2.master_role = 'FRONT', o2.mention_count = 85
    MERGE (o3:Entity {name: 'Oasis Wealth Management', case_id: 'CASE_SILKROAD_001'})
    SET o3.type = 'ORGANIZATION', o3.master_role = 'SHELL_COMPANY', o3.mention_count = 72

    // Locations
    MERGE (l1:Entity {name: 'Port of Rotterdam', case_id: 'CASE_SILKROAD_001'})
    SET l1.type = 'LOCATION', l1.mention_count = 150
    MERGE (l2:Entity {name: 'Macau Casino VIP Room', case_id: 'CASE_SILKROAD_001'})
    SET l2.type = 'LOCATION', l2.mention_count = 60
    MERGE (l3:Entity {name: 'Abandoned Warehouse 42', case_id: 'CASE_SILKROAD_001'})
    SET l3.type = 'LOCATION', l3.mention_count = 45

    // Evidence / Weapons
    MERGE (e1:Entity {name: 'Shipping Container ZX99', case_id: 'CASE_SILKROAD_001'})
    SET e1.type = 'VEHICLE', e1.mention_count = 80
    MERGE (e2:Entity {name: 'Burner Phone +4477123', case_id: 'CASE_SILKROAD_001'})
    SET e2.type = 'PHONE', e2.mention_count = 120
    
    // Relationships for Victor (Mastermind)
    MERGE (p1)-[r1:OWNS {chunk_text: '[{"chunk_id": "CHK_001", "text": "Corporate records show Petrov owns Global Export Solutions."}]', chunk_id: 'CHK_001', evidence: 'Corporate Registry', type: 'OWNS'}]->(o1)
    MERGE (p1)-[r2:FREQUENTS {chunk_text: '[{"chunk_id": "CHK_002", "text": "Surveillance spotted Petrov at Macau Casino."}]', chunk_id: 'CHK_002', evidence: 'CCTV Footage', type: 'FREQUENTS'}]->(l2)
    MERGE (p1)-[r3:CALLS {chunk_text: '[{"chunk_id": "CHK_003", "text": "Call logs link Petrov to Burner Phone."}]', chunk_id: 'CHK_003', evidence: 'Telecom Logs', type: 'CALLS'}]->(e2)
    
    // Relationships for Elena (Financier)
    MERGE (p2)-[r4:LAUNDERS_MONEY_THROUGH {chunk_text: '[{"chunk_id": "CHK_004", "text": "Financial analysis shows funds routed via Oasis Wealth."}]', chunk_id: 'CHK_004', evidence: 'Bank Statements', type: 'LAUNDERS_MONEY_THROUGH'}]->(o3)
    MERGE (p2)-[r5:ASSOCIATED_WITH {chunk_text: '[{"chunk_id": "CHK_005", "text": "Elena and Victor attended a gala together."}]', chunk_id: 'CHK_005', evidence: 'Photos', type: 'ASSOCIATED_WITH'}]->(p1)

    // Hidden Similarities: Marcus (Smuggler 1) and Diego (Smuggler 2)
    // Marcus connections
    MERGE (p3)-[r6:SMUGGLED_CONTRABAND {chunk_text: '[{"chunk_id": "CHK_006", "text": "Marcus handled Container ZX99."}]', chunk_id: 'CHK_006', evidence: 'Dock Logs', type: 'SMUGGLED_CONTRABAND'}]->(e1)
    MERGE (p3)-[r7:OPERATES_IN {chunk_text: '[{"chunk_id": "CHK_007", "text": "Marcus controls the Rotterdam port operations."}]', chunk_id: 'CHK_007', evidence: 'Informant', type: 'OPERATES_IN'}]->(l1)
    MERGE (p3)-[r8:USES_FRONT {chunk_text: '[{"chunk_id": "CHK_008", "text": "Marcus uses Pacific Freight Co for shipping."}]', chunk_id: 'CHK_008', evidence: 'Shipping Manifests', type: 'USES_FRONT'}]->(o2)

    // Diego connections
    MERGE (p4)-[r9:SMUGGLED_CONTRABAND {chunk_text: '[{"chunk_id": "CHK_009", "text": "Diego was caught unloading Container ZX99."}]', chunk_id: 'CHK_009', evidence: 'Police Report', type: 'SMUGGLED_CONTRABAND'}]->(e1)
    MERGE (p4)-[r10:OPERATES_IN {chunk_text: '[{"chunk_id": "CHK_010", "text": "Diego is active in Rotterdam."}]', chunk_id: 'CHK_010', evidence: 'Visa Records', type: 'OPERATES_IN'}]->(l1)
    MERGE (p4)-[r11:USES_FRONT {chunk_text: '[{"chunk_id": "CHK_011", "text": "Diego filed customs paperwork under Pacific Freight Co."}]', chunk_id: 'CHK_011', evidence: 'Customs DB', type: 'USES_FRONT'}]->(o2)
    
    // Hacker
    MERGE (p5)-[r12:HACKED {chunk_text: '[{"chunk_id": "CHK_012", "text": "Wei Chen hacked the Rotterdam port mainframe."}]', chunk_id: 'CHK_012', evidence: 'Server Logs', type: 'HACKED'}]->(l1)
    
    // Base Case Assignments
    WITH p1, p2, p3, p4, p5, o1, o2, o3, l1, l2, l3, e1, e2, c
    MERGE (p1)-[:BELONGS_TO]->(c)
    MERGE (p2)-[:BELONGS_TO]->(c)
    MERGE (p3)-[:BELONGS_TO]->(c)
    MERGE (p4)-[:BELONGS_TO]->(c)
    MERGE (p5)-[:BELONGS_TO]->(c)
    MERGE (o1)-[:BELONGS_TO]->(c)
    MERGE (o2)-[:BELONGS_TO]->(c)
    MERGE (o3)-[:BELONGS_TO]->(c)
    MERGE (l1)-[:BELONGS_TO]->(c)
    MERGE (l2)-[:BELONGS_TO]->(c)
    MERGE (l3)-[:BELONGS_TO]->(c)
    MERGE (e1)-[:BELONGS_TO]->(c)
    MERGE (e2)-[:BELONGS_TO]->(c)
    """
    
    # Inference Query
    infer_query = '''
    MATCH (a:Entity {case_id: 'CASE_SILKROAD_001'})-[r]->()
    WHERE NOT type(r) IN ['HAS_DOCUMENT', 'HAS_CHUNK', 'NEXT', 'MENTIONS', 'BELONGS_TO']
    WITH a, collect(DISTINCT type(r)) AS crimes
    MATCH (b:Entity {case_id: 'CASE_SILKROAD_001'})-[r2]->()
    WHERE NOT type(r2) IN ['HAS_DOCUMENT', 'HAS_CHUNK', 'NEXT', 'MENTIONS', 'BELONGS_TO']
      AND elementId(a) < elementId(b)
    WITH a, b, crimes, collect(DISTINCT type(r2)) AS crimes_b
    WITH a, b, 
         [x IN crimes WHERE x IN crimes_b] AS common_crimes,
         crimes, crimes_b
    WHERE size(common_crimes) >= 2
    WITH a, b, common_crimes, crimes, crimes_b,
         toFloat(size(common_crimes)) / (size(crimes) + size(crimes_b) - size(common_crimes)) AS score
    ORDER BY score DESC, size(common_crimes) DESC
    LIMIT 5
    MERGE (a)-[sim:INFERRED_SIMILAR_CRIME]->(b)
    SET sim.inferred = true,
        sim.evidence = "Inferred from matching behavioral profile.",
        sim.common_crimes = common_crimes,
        sim.score = score,
        sim.chunk_ids = [],
        sim.chunk_text = '[{"chunk_id": "SYS_INFER_01", "text": "AI Pattern Analysis detected matching M.O. between these suspects. Both share the following behavioral links."}]'
    '''

    with driver.session(database=DATABASE) as session:
        session.run("MATCH (n {case_id: 'CASE_SILKROAD_001'}) DETACH DELETE n")
        session.run("MATCH (c:Case {id: 'CASE_SILKROAD_001'}) DETACH DELETE c")
        session.run(query)
        session.run(infer_query)

if __name__ == "__main__":
    run_ingestion()
    print("Operation Silk Road generated successfully!")
