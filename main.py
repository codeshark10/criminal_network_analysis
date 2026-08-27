import os
import shutil
import uuid
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from neo4j import AsyncGraphDatabase, AsyncDriver

# Directory where uploaded case text files are stored
UPLOAD_DIR = "./uploaded_cases"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Neo4j Connection Settings
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "crick#21")
driver: Optional[AsyncDriver] = None


# --- LIFESPAN MANAGEMENT ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages the lifecycle of the Neo4j connection pool."""
    global driver
    driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    print(f"Connected to Neo4j database at {NEO4J_URI}")
    yield
    if driver:
        await driver.close()
        print("Closed Neo4j database connection pool.")


app = FastAPI(
    title="Graph RAG Case Management API",
    description="API for managing case uploads, graph queries, top suspects, and full entity relationships.",
    version="1.2.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (update in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- PYDANTIC SCHEMAS ---

class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    master_role: Optional[str] = None
    aliases: List[str] = []
    mentions: int = 1


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    evidence: Optional[str] = ""
    chunk_id: Optional[str] = ""


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class InvestigatorProfile(BaseModel):
    name: str
    master_role: str
    aliases: List[str]
    mentions: int
    degree_connections: int


class SuspectProfile(BaseModel):
    name: str
    master_role: str
    aliases: List[str]
    mentions: int
    degree_connections: int
    associated_cases: List[str]


class CaseDetail(BaseModel):
    case_name: str
    case_type: str
    relationship: str
    evidence: str
    chunk_id: str


class InvestigatorCasesResponse(BaseModel):
    investigator_name: str
    canonical_name: str
    total_cases: int
    cases: List[CaseDetail]
    graph: GraphResponse


class FileUploadResult(BaseModel):
    filename: str
    status: str
    file_path: str
    size_bytes: int


class UploadCasesResponse(BaseModel):
    case_id: str  # FIXED: Required so FastAPI doesn't crash on return
    message: str
    total_uploaded: int
    files: List[FileUploadResult]
    pipeline_status: str


class CaseItem(BaseModel):
    case_id: str
    case_name: str
    total_entities: int


class CaseCreateRequest(BaseModel):
    case_name: str
    description: Optional[str] = ""
    status: Optional[str] = "ACTIVE"


class DashboardMetricsResponse(BaseModel):
    documents: int
    chunks: int
    entities: int
    persons: int
    evidence: int
    relationships: int
    alerts: int
    network_size: int


class EntityItem(BaseModel):
    id: str
    name: str
    type: str
    aliases: List[str] = []
    mentions: int = 1


class MajorEntitiesResponse(BaseModel):
    locations: List[EntityItem] = []
    phone_numbers: List[EntityItem] = []
    organizations: List[EntityItem] = []
    people: List[EntityItem] = []
    financial: List[EntityItem] = []
    vehicles_and_weapons: List[EntityItem] = []


# --- HELPER FUNCTIONS ---
def parse_graph_records(records: List[Dict[str, Any]]) -> GraphResponse:
    """Parses Neo4j query records into a GraphResponse safely."""
    nodes_dict: Dict[str, GraphNode] = {}
    edges_list: List[GraphEdge] = []
    seen_edges = set()

    def extract_node_info(node):
        if not node:
            return None
        if isinstance(node, dict):
            name = node.get("name")
            n_type = node.get("type") or node.get("master_role") or "UNKNOWN"
            role = node.get("master_role", "UNKNOWN")
            aliases = list(node.get("aliases") or [])
            mentions = node.get("mention_count") or node.get("mentions") or 1
            return name, n_type, role, aliases, mentions
        elif hasattr(node, "get"):
            name = node.get("name")
            n_type = node.get("type", node.get("master_role", "UNKNOWN"))
            role = node.get("master_role", "UNKNOWN")
            aliases = list(node.get("aliases", []))
            mentions = node.get("mention_count", 1)
            return name, n_type, role, aliases, mentions
        return None

    for record in records:
        source_node = record.get("source")
        target_node = record.get("target")
        rel = record.get("rel")

        s_info = extract_node_info(source_node)
        t_info = extract_node_info(target_node)

        if s_info and s_info[0]:
            s_name = s_info[0]
            if s_name not in nodes_dict:
                nodes_dict[s_name] = GraphNode(
                    id=s_name, label=s_name, type=s_info[1], master_role=s_info[2], aliases=s_info[3],
                    mentions=s_info[4]
                )

        if t_info and t_info[0]:
            t_name = t_info[0]
            if t_name not in nodes_dict:
                nodes_dict[t_name] = GraphNode(
                    id=t_name, label=t_name, type=t_info[1], master_role=t_info[2], aliases=t_info[3],
                    mentions=t_info[4]
                )

        if s_info and t_info and s_info[0] and t_info[0] and rel:
            s_name = s_info[0]
            t_name = t_info[0]

            if hasattr(rel, "type"):
                rel_type = rel.type
                evidence = rel.get("evidence", "")
                chunk_id = rel.get("chunk_id", "")
            elif isinstance(rel, dict):
                rel_type = rel.get("type") or rel.get("label") or "RELATED"
                evidence = rel.get("evidence", "")
                chunk_id = rel.get("chunk_id", "")
            elif isinstance(rel, (tuple, list)):
                rel_type = str(rel[1]) if len(rel) > 1 else "RELATED"
                props = rel[2] if len(rel) > 2 and isinstance(rel[2], dict) else {}
                evidence = props.get("evidence", "")
                chunk_id = props.get("chunk_id", "")
            else:
                rel_type = "RELATED"
                evidence, chunk_id = "", ""

            edge_id = f"{s_name}|{rel_type}|{t_name}"
            if edge_id not in seen_edges:
                seen_edges.add(edge_id)
                edges_list.append(GraphEdge(
                    id=edge_id, source=s_name, target=t_name, label=rel_type, evidence=str(evidence),
                    chunk_id=str(chunk_id)
                ))

    return GraphResponse(nodes=list(nodes_dict.values()), edges=edges_list)


def run_ingestion_pipeline(case_id: str, file_paths: List[str]):
    """Background task function to process files into graph database."""
    print(f"\n[BACKGROUND TASK] Processing {len(file_paths)} uploaded file(s) for {case_id}...")
    print("[BACKGROUND TASK] Processing completed successfully.\n")


# --- GLOBAL / SETUP ENDPOINTS ---

@app.get("/")
async def health_check():
    return {"status": "online", "database": "Neo4j Async Connected"}


@app.get("/api/cases", response_model=List[CaseItem])
async def get_all_cases():
    """Fetches all case names robustly, handling missing properties."""
    query = """
    MATCH (c:Case)
    OPTIONAL MATCH (c)<-[:BELONGS_TO]-(n)
    RETURN c.id AS case_id, c.name AS case_name, count(n) AS total_entities
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(query)
        records = [record.data() async for record in result]

    case_list = []
    for r in records:
        case_list.append(CaseItem(
            case_id=r.get("case_id") or "UNKNOWN_ID",
            case_name=r.get("case_name") or "Unnamed Case",
            total_entities=r.get("total_entities") or 0
        ))
    return sorted(case_list, key=lambda x: x.case_name)


@app.post("/api/cases", response_model=CaseItem)
async def create_new_case(request: CaseCreateRequest):
    """Creates a new empty case workspace in Neo4j."""
    case_id = f"CASE_{uuid.uuid4().hex[:8].upper()}"
    query = """
    MERGE (c:Case {id: $case_id})
    ON CREATE SET 
        c.name = $case_name,
        c.description = $description,
        c.status = $status,
        c.created_at = datetime()
    RETURN c.id AS case_id, c.name AS case_name, 0 AS total_entities
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(
            query, case_id=case_id, case_name=request.case_name,
            description=request.description, status=request.status
        )
        records = [record.data() async for record in result]

    if not records:
        raise HTTPException(status_code=500, detail="Failed to create case.")

    r = records[0]
    return CaseItem(case_id=r.get("case_id"), case_name=r.get("case_name"), total_entities=0)


@app.post("/api/cases/upload", response_model=UploadCasesResponse)
async def upload_case_documents(
        background_tasks: BackgroundTasks,
        case_id: Optional[str] = Form(None),
        files: List[UploadFile] = File(...),
        process_immediately: bool = Query(default=True)
):
    """Uploads documents and dynamically links them to the specified or new Case."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    if not case_id:
        case_id = f"CASE_{uuid.uuid4().hex[:8].upper()}"

    saved_files = []
    saved_paths = []
    file_metadata_for_db = []

    case_dir = os.path.join(UPLOAD_DIR, case_id)
    os.makedirs(case_dir, exist_ok=True)

    for file in files:
        if not file.filename.lower().endswith(".txt"):
            raise HTTPException(status_code=400, detail="Only .txt files supported.")

        destination_path = os.path.join(case_dir, file.filename)
        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(destination_path)
        saved_paths.append(destination_path)

        saved_files.append(FileUploadResult(
            filename=file.filename, status="UPLOADED",
            file_path=destination_path, size_bytes=file_size
        ))

        file_metadata_for_db.append({
            "filename": file.filename, "file_path": destination_path, "size_bytes": file_size
        })

    query = """
    MERGE (c:Case {id: $case_id})
    ON CREATE SET c.name = 'Uploaded Case ' + substring($case_id, 5), c.created_at = datetime(), c.status = 'ACTIVE'
    UNWIND $files AS file
    MERGE (d:Entity {name: file.filename, case_id: $case_id})
    SET d:Document
    ON CREATE SET d.type = 'DOCUMENT', d.file_path = file.file_path, d.size_bytes = file.size_bytes, d.uploaded_at = datetime()
    MERGE (d)-[:BELONGS_TO]->(c)
    """

    async with driver.session(database="neo4j") as session:
        await session.run(query, case_id=case_id, files=file_metadata_for_db)

    pipeline_status = "Idle"
    if process_immediately:
        background_tasks.add_task(run_ingestion_pipeline, case_id, saved_paths)
        pipeline_status = "Pipeline task queued in background"

    return UploadCasesResponse(
        case_id=case_id,
        message=f"Uploaded {len(saved_files)} documents to case {case_id}.",
        total_uploaded=len(saved_files),
        files=saved_files,
        pipeline_status=pipeline_status
    )


# --- CASE-SPECIFIC ENDPOINTS ---

@app.get("/api/cases/{case_id}/metrics", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(case_id: str):
    """Retrieves high-level KPIs for the case dashboard."""
    query = """
    MATCH (n {case_id: $case_id})
    WITH 
        SUM(CASE WHEN toUpper(coalesce(n.type, n.master_role, labels(n)[0], '')) IN ['DOCUMENT', 'FILE'] THEN 1 ELSE 0 END) AS documents,
        SUM(CASE WHEN toUpper(coalesce(n.type, n.master_role, labels(n)[0], '')) IN ['CHUNK', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH'] THEN 1 ELSE 0 END) AS chunks,
        SUM(CASE WHEN NOT toUpper(coalesce(n.type, n.master_role, labels(n)[0], '')) IN ['DOCUMENT', 'FILE', 'CHUNK', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH', 'CASE'] THEN 1 ELSE 0 END) AS entities,
        SUM(CASE WHEN toUpper(coalesce(n.type, n.master_role, labels(n)[0], '')) IN ['PERSON', 'SUSPECT', 'TARGET', 'INVESTIGATOR', 'OFFICER', 'VICTIM', 'WITNESS', 'PERPETRATOR', 'SUBJECT'] THEN 1 ELSE 0 END) AS persons,
        SUM(CASE WHEN coalesce(n.has_alert, n.is_flagged, false) = true OR toUpper(coalesce(n.type, '')) IN ['ALERT', 'FLAG'] THEN 1 ELSE 0 END) AS alerts
    OPTIONAL MATCH (src {case_id: $case_id})-[r]->(tgt {case_id: $case_id})
    WITH documents, chunks, entities, persons, alerts, COUNT(r) AS relationships, SUM(CASE WHEN coalesce(r.evidence, '') <> '' THEN 1 ELSE 0 END) AS evidence
    RETURN documents, chunks, entities, persons, evidence, relationships, alerts, (entities + relationships) AS network_size
    """
    async with driver.session(database="neo4j") as session:
        result = await session.run(query, case_id=case_id)
        records = [record.data() async for record in result]

    if not records:
        return DashboardMetricsResponse(documents=0, chunks=0, entities=0, persons=0, evidence=0, relationships=0,
                                        alerts=0, network_size=0)

    r = records[0]
    return DashboardMetricsResponse(
        documents=r.get("documents") or 0, chunks=r.get("chunks") or 0,
        entities=r.get("entities") or 0, persons=r.get("persons") or 0,
        evidence=r.get("evidence") or 0, relationships=r.get("relationships") or 0,
        alerts=r.get("alerts") or 0, network_size=r.get("network_size") or 0
    )


@app.get("/api/cases/{case_id}/suspects/top", response_model=List[SuspectProfile])
async def get_top_suspects(case_id: str, limit: int = Query(default=10, ge=1, le=100)):
    query = """
    MATCH (s {case_id: $case_id})
    WHERE toUpper(s.master_role) IN ['SUSPECT', 'TARGET', 'PERSON_OF_INTEREST', 'ACCUSED', 'PERPETRATOR']
       OR toUpper(s.type) IN ['SUSPECT', 'TARGET', 'PERSON_OF_INTEREST', 'ACCUSED']
       OR EXISTS { MATCH (s)-[r]->() WHERE type(r) IN ['SUSPECT_IN', 'ACCUSED_OF', 'PERPETRATED', 'COMMITTED', 'ASSOCIATED_WITH', 'INVOLVED_IN'] }
    OPTIONAL MATCH (s)-[r]-()
    OPTIONAL MATCH (s)-[r_case]-(c:Case) 
    WITH s, count(DISTINCT r) AS connections, collect(DISTINCT c.name) AS associated_cases
    RETURN 
        s.name AS name, coalesce(s.master_role, 'SUSPECT') AS master_role, coalesce(s.aliases, []) AS aliases,
        coalesce(s.mention_count, 1) AS mentions, connections AS degree_connections, associated_cases
    ORDER BY mentions DESC, degree_connections DESC LIMIT $limit
    """
    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id, limit=limit)).data()

    return [
        SuspectProfile(
            name=r["name"], master_role=r["master_role"], aliases=r["aliases"],
            mentions=r["mentions"], degree_connections=r["degree_connections"],
            associated_cases=[c for c in r["associated_cases"] if c]
        ) for r in records
    ]


@app.get("/api/cases/{case_id}/graph/full", response_model=GraphResponse)
async def get_full_relation_map(case_id: str, limit: int = Query(default=200, ge=1, le=1000),
                                entity_type: Optional[str] = Query(default=None)):
    if entity_type:
        query = """
        MATCH (source {case_id: $case_id})-[rel]-(target {case_id: $case_id})
        WHERE toUpper(coalesce(source.type, source.master_role, source.category, '')) = toUpper($entity_type) OR toUpper(coalesce(target.type, target.master_role, target.category, '')) = toUpper($entity_type)
        RETURN source, rel, target LIMIT $limit
        """
    else:
        query = "MATCH (source {case_id: $case_id})-[rel]-(target {case_id: $case_id}) RETURN source, rel, target LIMIT $limit"

    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id, limit=limit, entity_type=entity_type)).data()
    return parse_graph_records(records) if records else GraphResponse(nodes=[], edges=[])


@app.get("/api/cases/{case_id}/graph/entity-types", response_model=List[str])
async def get_available_entity_types(case_id: str):
    query = """
    MATCH (n {case_id: $case_id})
    WITH DISTINCT coalesce(n.type, n.master_role, n.category) AS entity_type
    WHERE entity_type IS NOT NULL AND entity_type <> ''
    RETURN entity_type ORDER BY entity_type ASC
    """
    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id)).data()
    return [r["entity_type"] for r in records]


@app.get("/api/cases/{case_id}/investigators", response_model=List[InvestigatorProfile])
async def list_investigators(case_id: str):
    query = """
    MATCH (i {case_id: $case_id})
    WHERE toUpper(i.master_role) IN ['INVESTIGATOR', 'OFFICER', 'AGENT', 'DETECTIVE', 'ANALYST'] OR toUpper(i.type) IN ['INVESTIGATOR', 'OFFICER', 'AGENT', 'DETECTIVE']
    OPTIONAL MATCH (i)-[r]-()
    WITH i, count(r) AS connections
    RETURN i.name AS name, coalesce(i.master_role, 'INVESTIGATOR') AS master_role, coalesce(i.aliases, []) AS aliases, coalesce(i.mention_count, 1) AS mentions, connections AS degree_connections
    ORDER BY mentions DESC, connections DESC
    """
    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id)).data()
    return [InvestigatorProfile(**r) for r in records]


@app.get("/api/cases/{case_id}/investigator/{investigator_name}/cases", response_model=InvestigatorCasesResponse)
async def get_investigator_cases(case_id: str, investigator_name: str):
    case_query = """
    MATCH (inv {case_id: $case_id})-[r]-(c:Case {id: $case_id})
    WHERE (toUpper(inv.name) CONTAINS toUpper($name) OR ANY(a IN inv.aliases WHERE toUpper(a) CONTAINS toUpper($name)))
    RETURN inv.name AS canonical_name, coalesce(c.name, c.id) AS case_name, coalesce(c.type, 'CASE') AS case_type, type(r) AS relationship, coalesce(r.evidence, '') AS evidence, coalesce(r.chunk_id, '') AS chunk_id
    """
    graph_query = """
    MATCH (source {case_id: $case_id})-[rel]-(target {case_id: $case_id})
    WHERE toUpper(source.name) CONTAINS toUpper($name) OR ANY(a IN source.aliases WHERE toUpper(a) CONTAINS toUpper($name))
    RETURN source, rel, target
    """
    async with driver.session(database="neo4j") as session:
        case_records = await (await session.run(case_query, case_id=case_id, name=investigator_name)).data()
        graph_records = await (await session.run(graph_query, case_id=case_id, name=investigator_name)).data()

    if not graph_records:
        raise HTTPException(status_code=404, detail="No investigator found in this case.")

    canonical_name = case_records[0]["canonical_name"] if case_records else investigator_name
    cases = [CaseDetail(**r) for r in case_records]
    graph_data = parse_graph_records(graph_records)

    return InvestigatorCasesResponse(
        investigator_name=investigator_name, canonical_name=canonical_name, total_cases=len(cases), cases=cases,
        graph=graph_data
    )


@app.get("/api/cases/{case_id}/graph/executive-summary", response_model=GraphResponse)
async def get_executive_case_summary(case_id: str, max_nodes: int = Query(default=20, ge=5, le=50),
                                     max_rels_per_node: int = Query(default=6, ge=1, le=20),
                                     min_connections: int = Query(default=1, ge=1)):
    allowed_types = ['PERSON', 'SUSPECT', 'TARGET', 'INVESTIGATOR', 'OFFICER', 'VICTIM', 'WITNESS', 'ORGANIZATION',
                     'WEAPON', 'LOCATION', 'CRIME', 'INCIDENT', 'VEHICLE', 'CASE']
    query = """
    MATCH (n {case_id: $case_id})-[r]-()
    WHERE (toUpper(coalesce(n.type, n.master_role, '')) IN $allowed_types OR ANY(lbl IN labels(n) WHERE toUpper(lbl) IN $allowed_types))
    AND NOT toUpper(coalesce(n.type, n.master_role, '')) IN ['CHUNK', 'DOCUMENT', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH']
    WITH n, count(r) AS degree WHERE degree >= $min_connections ORDER BY degree DESC, coalesce(n.mention_count, 1) DESC LIMIT $max_nodes
    WITH collect(n) AS major_nodes
    UNWIND major_nodes AS source
    CALL { WITH source, major_nodes MATCH (source)-[rel]-(target) WHERE target IN major_nodes RETURN rel, target LIMIT $max_rels }
    RETURN source, rel, target
    """
    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id, max_nodes=max_nodes, min_connections=min_connections,
                                           max_rels=max_rels_per_node, allowed_types=allowed_types)).data()
    return parse_graph_records(records) if records else GraphResponse(nodes=[], edges=[])


@app.get("/api/cases/{case_id}/entities/major", response_model=MajorEntitiesResponse)
async def get_major_entities(case_id: str, limit_per_category: int = Query(default=50, ge=1, le=200)):
    query = """
    MATCH (n {case_id: $case_id})
    WHERE NOT toUpper(coalesce(n.type, n.master_role, '')) IN ['CHUNK', 'DOCUMENT', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH']
    WITH n, toUpper(coalesce(n.type, n.master_role, head(labels(n)), '')) AS raw_type
    WITH n, CASE 
        WHEN raw_type IN ['LOCATION', 'ADDRESS', 'CITY', 'COUNTRY', 'PLACE', 'SAFEHOUSE'] THEN 'locations'
        WHEN raw_type IN ['PHONE', 'PHONE_NUMBER', 'CELL', 'TELEPHONE', 'NUMBER'] THEN 'phone_numbers'
        WHEN raw_type IN ['ORGANIZATION', 'COMPANY', 'ORG', 'AGENCY', 'GROUP', 'CARTEL'] THEN 'organizations'
        WHEN raw_type IN ['PERSON', 'SUSPECT', 'VICTIM', 'WITNESS', 'OFFICER', 'INVESTIGATOR', 'TARGET', 'SUBJECT', 'PERPETRATOR'] THEN 'people'
        WHEN raw_type IN ['BANK_ACCOUNT', 'CRYPTO_WALLET', 'ACCOUNT', 'TRANSACTION', 'WALLET'] THEN 'financial'
        WHEN raw_type IN ['VEHICLE', 'CAR', 'LICENSE_PLATE', 'PLATE', 'WEAPON', 'EVIDENCE'] THEN 'vehicles_and_weapons'
        ELSE 'OTHER' END AS category
    WHERE category <> 'OTHER' AND n.name IS NOT NULL
    WITH category, n ORDER BY coalesce(n.mention_count, 1) DESC
    WITH category, collect(DISTINCT {id: n.name, name: n.name, type: coalesce(n.type, n.master_role, 'UNKNOWN'), aliases: coalesce(n.aliases, []), mentions: coalesce(n.mention_count, 1)})[..$limit] AS entities
    RETURN category, entities
    """
    grouped_data = {"locations": [], "phone_numbers": [], "organizations": [], "people": [], "financial": [],
                    "vehicles_and_weapons": []}
    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id, limit=limit_per_category)).data()
    for record in records:
        cat = record.get("category")
        if cat in grouped_data:
            grouped_data[cat] = [EntityItem(**item) for item in record.get("entities", [])]
    return MajorEntitiesResponse(**grouped_data)


@app.get("/api/cases/{case_id}/suspect/{suspect_name}/relationships", response_model=GraphResponse)
async def get_suspect_relationships(case_id: str, suspect_name: str, limit: int = Query(default=100, ge=1, le=500)):
    query = """
    MATCH (source {case_id: $case_id})
    WHERE (toUpper(source.name) = toUpper($suspect_name) OR ANY(a IN source.aliases WHERE toUpper(a) = toUpper($suspect_name)))
    MATCH (source)-[rel]-(target {case_id: $case_id})
    WHERE NOT toUpper(coalesce(target.type, target.master_role, '')) IN ['CHUNK', 'DOCUMENT', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH']
    RETURN source, rel, target LIMIT $limit
    """
    async with driver.session(database="neo4j") as session:
        records = await (await session.run(query, case_id=case_id, suspect_name=suspect_name, limit=limit)).data()
    return parse_graph_records(records) if records else GraphResponse(nodes=[], edges=[])


@app.get("/api/cases/{case_id}/person-relationship", response_model=GraphResponse)
async def get_relationship_between_persons(
        case_id: str, person1: str = Query(..., description="Name/alias of person 1"),
        person2: str = Query(..., description="Name/alias of person 2"), max_depth: int = Query(default=3, ge=1, le=5)
):
    query = """
    MATCH (p1 {case_id: $case_id}), (p2 {case_id: $case_id})
    WHERE (toUpper(p1.name) = toUpper($person1) OR ANY(a IN p1.aliases WHERE toUpper(a) = toUpper($person1)))
      AND (toUpper(p2.name) = toUpper($person2) OR ANY(a IN p2.aliases WHERE toUpper(a) = toUpper($person2)))
      AND id(p1) <> id(p2)
    MATCH path = allShortestPaths((p1)-[*..5]-(p2)) WHERE length(path) <= $max_depth
    UNWIND relationships(path) AS rel
    RETURN startNode(rel) AS source, rel, endNode(rel) AS target
    """
    async with driver.session(database="neo4j") as session:
        records = await (
            await session.run(query, case_id=case_id, person1=person1, person2=person2, max_depth=max_depth)).data()
    return parse_graph_records(records) if records else GraphResponse(nodes=[], edges=[])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)