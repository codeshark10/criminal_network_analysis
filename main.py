import os
import shutil
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Query
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
    version="1.1.0",
    lifespan=lifespan
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
    message: str
    total_uploaded: int
    files: List[FileUploadResult]
    pipeline_status: str


# --- HELPER FUNCTIONS ---
def parse_graph_records(records: List[Dict[str, Any]]) -> GraphResponse:
    """Parses Neo4j query records into a GraphResponse, safely handling Dict, Tuple, and Relationship objects."""
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
        elif hasattr(node, "get"):  # Native Neo4j Node object
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

            # Extract relationship type & properties across varying return types
            if hasattr(rel, "type"):  # Native Neo4j Relationship object
                rel_type = rel.type
                evidence = rel.get("evidence", "")
                chunk_id = rel.get("chunk_id", "")
            elif isinstance(rel, dict):  # Dict output from result.data()
                rel_type = rel.get("type") or rel.get("label") or "RELATED"
                evidence = rel.get("evidence", "")
                chunk_id = rel.get("chunk_id", "")
            elif isinstance(rel, (tuple, list)):  # Tuple output format
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
                    id=edge_id,
                    source=s_name,
                    target=t_name,
                    label=rel_type,
                    evidence=str(evidence),
                    chunk_id=str(chunk_id)
                ))

    return GraphResponse(nodes=list(nodes_dict.values()), edges=edges_list)


def run_ingestion_pipeline(file_paths: List[str]):
    """Background task function to process files into graph database."""
    print(f"\n[BACKGROUND TASK] Processing {len(file_paths)} uploaded case file(s)...")
    # Execute extraction/resolution/ingest pipeline scripts here
    print("[BACKGROUND TASK] Processing completed successfully.\n")


# --- ENDPOINTS ---

@app.get("/")
async def health_check():
    """Simple API health check endpoint."""
    return {"status": "online", "database": "Neo4j Async Connected"}


@app.post("/api/cases/upload", response_model=UploadCasesResponse)
async def upload_case_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    process_immediately: bool = Query(default=True)
):
    """
    Upload single or multiple .txt case documents.
    - Saves files to `./uploaded_cases/`
    - Validates file formats
    - Triggers graph processing background pipeline if enabled
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    saved_files: List[FileUploadResult] = []
    saved_paths: List[str] = []

    for file in files:
        if not file.filename.lower().endswith(".txt"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type for '{file.filename}'. Only .txt files are supported."
            )

        destination_path = os.path.join(UPLOAD_DIR, file.filename)

        try:
            with open(destination_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to write file '{file.filename}': {str(e)}"
            )
        finally:
            await file.close()

        file_size = os.path.getsize(destination_path)
        saved_paths.append(destination_path)

        saved_files.append(
            FileUploadResult(
                filename=file.filename,
                status="UPLOADED",
                file_path=destination_path,
                size_bytes=file_size
            )
        )

    pipeline_status = "Idle"
    if process_immediately:
        background_tasks.add_task(run_ingestion_pipeline, saved_paths)
        pipeline_status = "Pipeline task queued in background"

    return UploadCasesResponse(
        message=f"Successfully uploaded {len(saved_files)} document(s).",
        total_uploaded=len(saved_files),
        files=saved_files,
        pipeline_status=pipeline_status
    )


@app.get("/api/suspects/top", response_model=List[SuspectProfile])
async def get_top_suspects(limit: int = Query(default=10, ge=1, le=100)):
    """
    Fetches top suspects ranked by mentions, total degree connections, and case involvement.
    """
    query = """
    MATCH (s:Entity)
    WHERE toUpper(s.master_role) IN ['SUSPECT', 'TARGET', 'PERSON_OF_INTEREST', 'ACCUSED', 'PERPETRATOR']
       OR toUpper(s.type) IN ['SUSPECT', 'TARGET', 'PERSON_OF_INTEREST', 'ACCUSED']
       OR EXISTS {
         MATCH (s)-[r]->()
         WHERE type(r) IN ['SUSPECT_IN', 'ACCUSED_OF', 'PERPETRATED', 'COMMITTED', 'ASSOCIATED_WITH', 'INVOLVED_IN']
       }
    OPTIONAL MATCH (s)-[r]-()
    OPTIONAL MATCH (s)-[r_case]-(c:Entity) 
      WHERE toUpper(c.type) IN ['CASE', 'INCIDENT', 'CRIME', 'EVENT', 'FILE']
    WITH s, count(DISTINCT r) AS connections, collect(DISTINCT c.name) AS associated_cases
    RETURN 
        s.name AS name,
        coalesce(s.master_role, 'SUSPECT') AS master_role,
        coalesce(s.aliases, []) AS aliases,
        coalesce(s.mention_count, 1) AS mentions,
        connections AS degree_connections,
        associated_cases
    ORDER BY mentions DESC, degree_connections DESC
    LIMIT $limit
    """
    async with driver.session() as session:
        result = await session.run(query, limit=limit)
        records = await result.data()

    return [
        SuspectProfile(
            name=r["name"],
            master_role=r["master_role"],
            aliases=r["aliases"],
            mentions=r["mentions"],
            degree_connections=r["degree_connections"],
            associated_cases=[c for c in r["associated_cases"] if c]
        ) for r in records
    ]


@app.get("/api/graph/full", response_model=GraphResponse)
async def get_full_relation_map(
    limit: int = Query(default=200, ge=1, le=1000),
    entity_type: Optional[str] = Query(default=None, description="Filter source node by type or role")
):
    """
    Retrieves global graph nodes and edges with fallback property matching.
    """
    if entity_type:
        # Checks type, master_role, and category fields dynamically
        query = """
        MATCH (source)-[rel]-(target)
        WHERE toUpper(coalesce(source.type, source.master_role, source.category, '')) = toUpper($entity_type)
           OR toUpper(coalesce(target.type, target.master_role, target.category, '')) = toUpper($entity_type)
        RETURN source, rel, target
        LIMIT $limit
        """
    else:
        query = """
        MATCH (source)-[rel]-(target)
        RETURN source, rel, target
        LIMIT $limit
        """

    async with driver.session() as session:
        result = await session.run(query, limit=limit, entity_type=entity_type)
        records = await result.data()

    if not records:
        return GraphResponse(nodes=[], edges=[])

    return parse_graph_records(records)


@app.get("/api/graph/entity-types", response_model=List[str])
async def get_available_entity_types():
    """Returns all distinct entity types/roles present in the Neo4j graph."""
    query = """
    MATCH (n)
    WITH DISTINCT coalesce(n.type, n.master_role, n.category) AS entity_type
    WHERE entity_type IS NOT NULL AND entity_type <> ''
    RETURN entity_type ORDER BY entity_type ASC
    """
    async with driver.session() as session:
        result = await session.run(query)
        records = await result.data()

    return [r["entity_type"] for r in records]
@app.get("/api/investigators", response_model=List[InvestigatorProfile])
async def list_investigators():
    """Lists all investigators, detectives, officers, and agents stored in Neo4j."""
    query = """
    MATCH (i:Entity)
    WHERE toUpper(i.master_role) IN ['INVESTIGATOR', 'OFFICER', 'AGENT', 'DETECTIVE', 'ANALYST']
       OR toUpper(i.type) IN ['INVESTIGATOR', 'OFFICER', 'AGENT', 'DETECTIVE']
       OR EXISTS {
         MATCH (i)-[r]->() 
         WHERE type(r) IN ['INVESTIGATED', 'ASSIGNED_TO', 'REPORTED', 'ARRESTED', 'INTERROGATED', 'SEIZED', 'FILED']
       }
    OPTIONAL MATCH (i)-[r]-()
    WITH i, count(r) AS connections
    RETURN 
        i.name AS name,
        coalesce(i.master_role, 'INVESTIGATOR') AS master_role,
        coalesce(i.aliases, []) AS aliases,
        coalesce(i.mention_count, 1) AS mentions,
        connections AS degree_connections
    ORDER BY mentions DESC, connections DESC
    """
    async with driver.session() as session:
        result = await session.run(query)
        records = await result.data()

    return [
        InvestigatorProfile(
            name=r["name"],
            master_role=r["master_role"],
            aliases=r["aliases"],
            mentions=r["mentions"],
            degree_connections=r["degree_connections"]
        ) for r in records
    ]


@app.get("/api/investigator/{investigator_name}/cases", response_model=InvestigatorCasesResponse)
async def get_investigator_cases(investigator_name: str):
    """Retrieves all cases and the neighborhood graph for a specified investigator."""
    case_query = """
    MATCH (inv:Entity)-[r]-(c:Entity)
    WHERE (toUpper(inv.name) CONTAINS toUpper($name) OR ANY(a IN inv.aliases WHERE toUpper(a) CONTAINS toUpper($name)))
      AND (
        toUpper(c.type) IN ['CASE', 'INCIDENT', 'CRIME', 'EVENT', 'ORGANIZATION', 'FILE'] 
        OR type(r) IN ['INVESTIGATED', 'ASSIGNED_TO', 'HANDLED', 'REPORTED', 'OPENED_CASE', 'ARRESTED', 'INTERROGATED']
      )
    RETURN 
        inv.name AS canonical_name,
        c.name AS case_name,
        coalesce(c.type, 'CASE') AS case_type,
        type(r) AS relationship,
        coalesce(r.evidence, '') AS evidence,
        coalesce(r.chunk_id, '') AS chunk_id
    """

    graph_query = """
    MATCH (source:Entity)-[rel]-(target:Entity)
    WHERE toUpper(source.name) CONTAINS toUpper($name) 
       OR ANY(a IN source.aliases WHERE toUpper(a) CONTAINS toUpper($name))
    RETURN source, rel, target
    """

    async with driver.session() as session:
        case_result = await session.run(case_query, name=investigator_name)
        case_records = await case_result.data()

        graph_result = await session.run(graph_query, name=investigator_name)
        graph_records = await graph_result.data()

    if not graph_records:
        raise HTTPException(
            status_code=404,
            detail=f"No investigator or associated cases found matching '{investigator_name}'."
        )

    canonical_name = case_records[0]["canonical_name"] if case_records else investigator_name

    cases = [
        CaseDetail(
            case_name=r["case_name"],
            case_type=r["case_type"],
            relationship=r["relationship"],
            evidence=r["evidence"],
            chunk_id=r["chunk_id"]
        ) for r in case_records
    ]

    graph_data = parse_graph_records(graph_records)

    return InvestigatorCasesResponse(
        investigator_name=investigator_name,
        canonical_name=canonical_name,
        total_cases=len(cases),
        cases=cases,
        graph=graph_data
    )


@app.get("/api/graph/executive-summary", response_model=GraphResponse)
async def get_executive_case_summary(
        max_nodes: int = Query(default=20, ge=5, le=50, description="Top N major entities to extract"),
        max_rels_per_node: int = Query(default=6, ge=1, le=20, description="Max relationships per node"),
        min_connections: int = Query(default=1, ge=1, description="Minimum relationship count required")
):
    """
    Generates an executive summary graph of top major entities,
    capping relationships per node to prevent visualization clutter.
    """
    allowed_entity_types = [
        'PERSON', 'SUSPECT', 'TARGET', 'INVESTIGATOR', 'OFFICER',
        'VICTIM', 'WITNESS', 'ORGANIZATION', 'WEAPON', 'LOCATION',
        'CRIME', 'INCIDENT', 'VEHICLE', 'CASE'
    ]

    query = """
    // 1. Select top N major entities ranked by overall degree
    MATCH (n)-[r]-()
    WHERE (
      toUpper(coalesce(n.type, n.master_role, '')) IN $allowed_types
      OR ANY(lbl IN labels(n) WHERE toUpper(lbl) IN $allowed_types)
    )
    AND NOT toUpper(coalesce(n.type, n.master_role, '')) IN ['CHUNK', 'DOCUMENT', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH']

    WITH n, count(r) AS degree
    WHERE degree >= $min_connections
    ORDER BY degree DESC, coalesce(n.mention_count, 1) DESC
    LIMIT $max_nodes

    WITH collect(n) AS major_nodes

    // 2. Fetch up to max_rels connections per source node
    UNWIND major_nodes AS source
    CALL {
      WITH source, major_nodes
      MATCH (source)-[rel]-(target)
      WHERE target IN major_nodes
      RETURN rel, target
      LIMIT $max_rels
    }
    RETURN source, rel, target
    """

    async with driver.session() as session:
        result = await session.run(
            query,
            max_nodes=max_nodes,
            min_connections=min_connections,
            max_rels=max_rels_per_node,
            allowed_types=allowed_entity_types
        )
        records = await result.data()

    if not records:
        fallback_query = """
        MATCH (n)-[r]-()
        WHERE NOT toUpper(coalesce(n.type, n.master_role, '')) IN ['CHUNK', 'DOCUMENT', 'TEXT']
        WITH n, count(r) AS degree
        ORDER BY degree DESC
        LIMIT $max_nodes
        WITH collect(n) AS major_nodes
        UNWIND major_nodes AS source
        CALL {
          WITH source, major_nodes
          MATCH (source)-[rel]-(target)
          WHERE target IN major_nodes
          RETURN rel, target
          LIMIT $max_rels
        }
        RETURN source, rel, target
        """
        async with driver.session() as session:
            result = await session.run(
                fallback_query,
                max_nodes=max_nodes,
                max_rels=max_rels_per_node
            )
            records = await result.data()

    return parse_graph_records(records)


@app.get("/api/cases", response_model=List[str])
async def list_case_names():
    """Returns all case names available in the database for dropdown selection."""
    query = """
    MATCH (c)
    WHERE toUpper(coalesce(c.type, c.master_role, '')) IN ['CASE', 'INCIDENT', 'CRIME', 'EVENT', 'FILE']
    RETURN DISTINCT c.name AS case_name
    ORDER BY case_name ASC
    """
    async with driver.session() as session:
        result = await session.run(query)
        records = await result.data()

    return [r["case_name"] for r in records if r["case_name"]]

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

@app.get("/api/entities/major", response_model=MajorEntitiesResponse)
async def get_major_entities(
        limit_per_category: int = Query(default=50, ge=1, le=200, description="Max entities per category")
):
    """
    Extracts and categorizes all primary entities from the database into distinct groups
    (Locations, Phone Numbers, Organizations, People, Financial, Vehicles/Weapons).
    """
    query = """
    MATCH (n)
    WHERE NOT toUpper(coalesce(n.type, n.master_role, '')) IN ['CHUNK', 'DOCUMENT', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH']

    WITH n, toUpper(coalesce(n.type, n.master_role, head(labels(n)), '')) AS raw_type
    WITH n, 
      CASE 
        WHEN raw_type IN ['LOCATION', 'ADDRESS', 'CITY', 'COUNTRY', 'PLACE', 'SAFEHOUSE'] THEN 'locations'
        WHEN raw_type IN ['PHONE', 'PHONE_NUMBER', 'CELL', 'TELEPHONE', 'NUMBER'] THEN 'phone_numbers'
        WHEN raw_type IN ['ORGANIZATION', 'COMPANY', 'ORG', 'AGENCY', 'GROUP', 'CARTEL'] THEN 'organizations'
        WHEN raw_type IN ['PERSON', 'SUSPECT', 'VICTIM', 'WITNESS', 'OFFICER', 'INVESTIGATOR', 'TARGET', 'SUBJECT', 'PERPETRATOR'] THEN 'people'
        WHEN raw_type IN ['BANK_ACCOUNT', 'CRYPTO_WALLET', 'ACCOUNT', 'TRANSACTION', 'WALLET'] THEN 'financial'
        WHEN raw_type IN ['VEHICLE', 'CAR', 'LICENSE_PLATE', 'PLATE', 'WEAPON', 'EVIDENCE'] THEN 'vehicles_and_weapons'
        ELSE 'OTHER'
      END AS category

    WHERE category <> 'OTHER' AND n.name IS NOT NULL

    WITH category, n
    ORDER BY coalesce(n.mention_count, 1) DESC

    WITH category, collect(DISTINCT {
      id: n.name,
      name: n.name,
      type: coalesce(n.type, n.master_role, 'UNKNOWN'),
      aliases: coalesce(n.aliases, []),
      mentions: coalesce(n.mention_count, 1)
    })[..$limit] AS entities

    RETURN category, entities
    """

    grouped_data: Dict[str, List[EntityItem]] = {
        "locations": [],
        "phone_numbers": [],
        "organizations": [],
        "people": [],
        "financial": [],
        "vehicles_and_weapons": []
    }

    async with driver.session() as session:
        result = await session.run(query, limit=limit_per_category)
        records = await result.data()

    for record in records:
        cat = record.get("category")
        items = record.get("entities", [])
        if cat in grouped_data:
            grouped_data[cat] = [EntityItem(**item) for item in items]

    return MajorEntitiesResponse(**grouped_data)


@app.get("/api/suspect/{suspect_name}/relationships", response_model=GraphResponse)
async def get_suspect_relationships(
        suspect_name: str,
        limit: int = Query(default=100, ge=1, le=500, description="Max connected entities to retrieve")
):
    """
    Retrieves all 1-hop relationships and connected entities (Locations, Phones,
    Accomplices, Vehicles, Weapons) for a given suspect name or alias.
    """
    query = """
    // 1. Match suspect by exact name or alias
    MATCH (source)
    WHERE (toUpper(source.name) = toUpper($suspect_name) OR ANY(a IN source.aliases WHERE toUpper(a) = toUpper($suspect_name)))
      AND (
        toUpper(coalesce(source.type, source.master_role, '')) IN ['SUSPECT', 'PERSON', 'TARGET', 'PERPETRATOR', 'SUBJECT']
        OR ANY(lbl IN labels(source) WHERE toUpper(lbl) IN ['SUSPECT', 'PERSON', 'TARGET'])
      )

    // 2. Fetch all direct relationships excluding internal text chunks
    MATCH (source)-[rel]-(target)
    WHERE NOT toUpper(coalesce(target.type, target.master_role, '')) IN ['CHUNK', 'DOCUMENT', 'FILE_CHUNK', 'TEXT', 'PARAGRAPH']

    RETURN source, rel, target
    LIMIT $limit
    """

    async with driver.session() as session:
        result = await session.run(query, suspect_name=suspect_name, limit=limit)
        records = await result.data()

    if not records:
        # Fallback: Partial name search if exact match yields no results
        fallback_query = """
        MATCH (source)-[rel]-(target)
        WHERE toUpper(source.name) CONTAINS toUpper($suspect_name)
          AND NOT toUpper(coalesce(target.type, target.master_role, '')) IN ['CHUNK', 'DOCUMENT', 'TEXT']
        RETURN source, rel, target
        LIMIT $limit
        """
        async with driver.session() as session:
            result = await session.run(fallback_query, suspect_name=suspect_name, limit=limit)
            records = await result.data()

    return parse_graph_records(records)

@app.get("/api/cases/{case_id}/person-relationship", response_model=GraphResponse)
async def get_relationship_between_persons(
    case_id: str,
    person1: str = Query(..., description="Name or alias of the first person"),
    person2: str = Query(..., description="Name or alias of the second person"),
    max_depth: int = Query(default=3, ge=1, le=5, description="Maximum degrees of separation (1-5 hops)")
):
    """
    Finds shortest interconnecting paths between two specific individuals
    within a case, exposing direct contacts and intermediate assets/brokers.
    """
    query = """
    // 1. Locate Person 1 and Person 2 by name or alias in the given case
    MATCH (p1)
    WHERE (toUpper(p1.name) = toUpper($person1) OR ANY(a IN p1.aliases WHERE toUpper(a) = toUpper($person1)))
      AND p1.case_id = $case_id

    MATCH (p2)
    WHERE (toUpper(p2.name) = toUpper($person2) OR ANY(a IN p2.aliases WHERE toUpper(a) = toUpper($person2)))
      AND p2.case_id = $case_id
      AND id(p1) <> id(p2)

    // 2. Compute all shortest connecting paths up to max_depth
    MATCH path = allShortestPaths((p1)-[*..5]-(p2))
    WHERE length(path) <= $max_depth

    // 3. Deconstruct path edges into source-rel-target records
    UNWIND relationships(path) AS rel
    RETURN startNode(rel) AS source, rel, endNode(rel) AS target
    """

    async with driver.session() as session:
        result = await session.run(
            query,
            case_id=case_id,
            person1=person1,
            person2=person2,
            max_depth=max_depth
        )
        records = await result.data()

    if not records:
        return GraphResponse(nodes=[], edges=[])

    return parse_graph_records(records)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)