// ============================================================
// NEXUS — Centralised API Client
// All calls to the FastAPI backend (main.py) go through here.
// Each function maps 1-to-1 to an endpoint in main.py.
// ============================================================

// ── Shared backend types ────────────────────────────────────

export interface ApiGraphNode {
  id: string;
  label: string;
  type: string;
  master_role?: string | null;
  aliases: string[];
  mentions: number;
}

export interface ApiGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  evidence?: string;
  chunk_id?: string;
}

export interface ApiGraphResponse {
  nodes: ApiGraphNode[];
  edges: ApiGraphEdge[];
}

export interface SuspectProfile {
  name: string;
  master_role: string;
  aliases: string[];
  mentions: number;
  degree_connections: number;
  associated_cases: string[];
}

export interface EntityItem {
  id: string;
  name: string;
  type: string;
  aliases: string[];
  mentions: number;
}

export interface MajorEntitiesResponse {
  locations: EntityItem[];
  phone_numbers: EntityItem[];
  organizations: EntityItem[];
  people: EntityItem[];
  financial: EntityItem[];
  vehicles_and_weapons: EntityItem[];
}

export interface FileUploadResult {
  filename: string;
  status: string;
  file_path: string;
  size_bytes: number;
}

export interface UploadCasesResponse {
  message: string;
  total_uploaded: number;
  files: FileUploadResult[];
  pipeline_status: string;
}

export interface CaseItem {
  case_id: string;
  case_name: string;
  total_entities: number;
}

export interface DashboardMetricsResponse {
  documents: number;
  chunks: number;
  entities: number;
  persons: number;
  evidence: number;
  relationships: number;
  alerts: number;
  network_size: number;
}


// ── Generic fetch helper ────────────────────────────────────

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    let detail = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const json = await response.json();
      if (json.detail) {
        detail = typeof json.detail === 'string' ? json.detail : JSON.stringify(json.detail);
      }
    } catch {
      // keep default message
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.set(key, String(val));
      }
    });
  }
  return url.toString();
}

// ── Endpoint: POST /api/cases/upload ───────────────────────
/**
 * Upload one or more .txt case documents.
 * Field name must be 'files'. process_immediately is a query param.
 */
export async function uploadCaseDocuments(
  caseId: string,
  files: File[],
  processImmediately = true
): Promise<UploadCasesResponse> {
  const formData = new FormData();
  formData.append('case_id', caseId);
  files.forEach((f) => formData.append('files', f));

  const url = buildUrl('/api/cases/upload', { process_immediately: processImmediately });

  // Do NOT set Content-Type — browser sets multipart/form-data boundary automatically
  const response = await fetch(url, { method: 'POST', body: formData });

  if (!response.ok) {
    let detail = 'Upload failed. Check your connection and try again.';
    try {
      const json = await response.json();
      if (json.detail) {
        detail = typeof json.detail === 'string' ? json.detail : JSON.stringify(json.detail);
      }
    } catch {
      // keep default
    }
    throw new Error(detail);
  }

  return response.json();
}

// ── Endpoint: GET /api/cases/{case_id}/suspects/top ──────────
export async function getTopSuspects(caseId: string, limit = 10): Promise<SuspectProfile[]> {
  const encoded = encodeURIComponent(caseId);
  return apiFetch<SuspectProfile[]>(buildUrl(`/api/cases/${encoded}/suspects/top`, { limit }));
}

// ── Endpoint: GET /api/cases/{case_id}/graph/full ─────────────
export async function getFullGraph(
  caseId: string,
  limit = 200,
  entity_type?: string
): Promise<ApiGraphResponse> {
  const encoded = encodeURIComponent(caseId);
  return apiFetch<ApiGraphResponse>(buildUrl(`/api/cases/${encoded}/graph/full`, { limit, entity_type }));
}

// ── Endpoint: GET /api/cases/{case_id}/graph/entity-types ─────
export async function getEntityTypes(caseId: string): Promise<string[]> {
  const encoded = encodeURIComponent(caseId);
  return apiFetch<string[]>(buildUrl(`/api/cases/${encoded}/graph/entity-types`));
}

// ── Endpoint: GET /api/cases/{case_id}/graph/executive-summary 
export async function getExecutiveSummary(
  caseId: string,
  max_nodes = 20,
  max_rels_per_node = 6,
  min_connections = 1
): Promise<ApiGraphResponse> {
  const encoded = encodeURIComponent(caseId);
  return apiFetch<ApiGraphResponse>(
    buildUrl(`/api/cases/${encoded}/graph/executive-summary`, { max_nodes, max_rels_per_node, min_connections })
  );
}

// ── Endpoint: GET /api/cases ───────────────────────────────
export async function getCases(): Promise<CaseItem[]> {
  return apiFetch<CaseItem[]>(buildUrl('/api/cases'));
}

// ── Endpoint: GET /api/cases/{case_id}/entities/major ─────────
export async function getMajorEntities(
  caseId: string,
  limit_per_category = 50
): Promise<MajorEntitiesResponse> {
  const encoded = encodeURIComponent(caseId);
  return apiFetch<MajorEntitiesResponse>(
    buildUrl(`/api/cases/${encoded}/entities/major`, { limit_per_category })
  );
}

// ── Endpoint: GET /api/cases/{case_id}/suspect/{suspect_name}/relationships ─
export async function getSuspectRelationships(
  caseId: string,
  suspectName: string,
  limit = 100
): Promise<ApiGraphResponse> {
  const encodedCase = encodeURIComponent(caseId);
  const encodedSuspect = encodeURIComponent(suspectName);
  return apiFetch<ApiGraphResponse>(
    buildUrl(`/api/cases/${encodedCase}/suspect/${encodedSuspect}/relationships`, { limit })
  );
}

// ── Endpoint: GET /api/cases/{case_id}/person-relationship ──
export async function getPersonRelationship(
  caseId: string,
  person1: string,
  person2: string,
  maxDepth = 3
): Promise<ApiGraphResponse> {
  const encoded = encodeURIComponent(caseId);
  return apiFetch<ApiGraphResponse>(
    buildUrl(`/api/cases/${encoded}/person-relationship`, {
      person1,
      person2,
      max_depth: maxDepth,
    })
  );
}

// ── Endpoint: GET /api/cases/{case_id}/metrics ──────────────────
export async function getDashboardMetrics(caseId: string): Promise<DashboardMetricsResponse> {
  const encoded = encodeURIComponent(caseId);
  return apiFetch<DashboardMetricsResponse>(buildUrl(`/api/cases/${encoded}/metrics`));
}
