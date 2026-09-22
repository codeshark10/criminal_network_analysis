// ============================================================
// Crimeglass — Backend-to-Frontend Type Adapters
// Converts ApiGraphNode/ApiGraphEdge (FastAPI backend format)
// into GraphNode/GraphRelationship (D3 frontend format).
// ============================================================

import type { GraphNode, GraphRelationship, EntityType, RelationshipType } from '../types/graph';
import type { ApiGraphNode, ApiGraphEdge, SuspectProfile } from './apiClient';

// ── Entity type normalizer ──────────────────────────────────
// Maps arbitrary strings from Neo4j to the typed EntityType enum.

const ENTITY_TYPE_MAP: Record<string, EntityType> = {
  // People
  PERSON: 'PERSON', SUSPECT: 'PERSON', VICTIM: 'PERSON', WITNESS: 'PERSON',
  OFFICER: 'PERSON', INVESTIGATOR: 'PERSON', TARGET: 'PERSON', PERPETRATOR: 'PERSON',
  ACCUSED: 'PERSON', SUBJECT: 'PERSON', AGENT: 'PERSON', DETECTIVE: 'PERSON',
  // Orgs
  ORGANIZATION: 'ORGANIZATION', ORG: 'ORGANIZATION', COMPANY: 'ORGANIZATION',
  AGENCY: 'ORGANIZATION', GROUP: 'ORGANIZATION', CARTEL: 'ORGANIZATION',
  // Locations
  LOCATION: 'LOCATION', ADDRESS: 'LOCATION', CITY: 'LOCATION',
  COUNTRY: 'LOCATION', PLACE: 'LOCATION', SAFEHOUSE: 'LOCATION',
  // Phones
  PHONE: 'PHONE', PHONE_NUMBER: 'PHONE', TELEPHONE: 'PHONE',
  CELL: 'PHONE', NUMBER: 'PHONE',
  // Vehicles
  VEHICLE: 'VEHICLE', CAR: 'VEHICLE', TRANSPORT: 'VEHICLE',
  LICENSE_PLATE: 'VEHICLE', PLATE: 'VEHICLE',
  // Bank / Financial
  BANK_ACCOUNT: 'BANK_ACCOUNT', ACCOUNT: 'BANK_ACCOUNT', WALLET: 'BANK_ACCOUNT',
  CRYPTO_WALLET: 'BANK_ACCOUNT',
  // Transactions
  TRANSACTION: 'TRANSACTION', FINANCIAL: 'TRANSACTION',
  // Cases
  CASE: 'CASE', INCIDENT: 'CASE', CRIME: 'CASE', FILE: 'CASE',
  // Weapons / Evidence → EVIDENCE fallback
  WEAPON: 'EVIDENCE', EVIDENCE: 'EVIDENCE',
};

export function mapEntityType(raw: string | null | undefined): EntityType {
  if (!raw) return 'UNKNOWN';
  const upper = raw.toUpperCase().trim();
  return ENTITY_TYPE_MAP[upper] ?? upper;
}

// ── Relationship type normalizer ─────────────────────────────
// Backend can return any string as the edge label.
// We keep it as-is if it matches a known RelationshipType,
// otherwise fall back to 'RELATED_TO'.

const KNOWN_RELATIONSHIP_TYPES = new Set<string>([
  'COMMUNICATED_WITH', 'ASSOCIATED_WITH', 'LOCATED_AT', 'USES', 'OWNS', 'OWNED_BY',
  'TRANSFERRED', 'RECEIVED', 'INVOLVED_IN', 'OBSERVED_AT', 'WORKS_FOR',
  'MEETING_WITH', 'MENTIONED_IN', 'CONNECTED_TO', 'RELATED_TO', 'PART_OF',
  'INFERRED_ASSOCIATE',
]);

export function mapRelationshipType(raw: string | null | undefined): RelationshipType {
  if (!raw) return 'RELATED_TO';
  const upper = raw.toUpperCase().replace(/\s+/g, '_');
  return KNOWN_RELATIONSHIP_TYPES.has(upper) ? (upper as RelationshipType) : 'RELATED_TO';
}

// ── Node adapter ─────────────────────────────────────────────

export function adaptApiNode(apiNode: ApiGraphNode): GraphNode {
  const rawType = (apiNode.properties?.type as string) || apiNode.type || apiNode.master_role || 'UNKNOWN';
  const resolvedType = mapEntityType(rawType);
  const nameVal = (apiNode.properties?.name as string) ||
                  (apiNode.properties?.identifier as string) ||
                  apiNode.name ||
                  apiNode.label ||
                  apiNode.id;
  
  return {
    id: apiNode.id,
    labels: [rawType, 'Entity'],
    type: resolvedType,
    displayName: nameVal,
    properties: {
      ...(apiNode.properties || {}),
      name: (apiNode.properties?.name as string) || nameVal,
      identifier: (apiNode.properties?.identifier as string) || nameVal,
      type: rawType,
      aliases: apiNode.aliases ? apiNode.aliases.join(', ') : '',
      mentions: apiNode.mentions ?? 0,
      role: apiNode.master_role,
    },
    caseIds: [],
    // Use mentions as a proxy for investigation priority
    investigationPriority: Math.min(100, (apiNode.mentions ?? 0) * 10),
    evidenceCount: apiNode.mentions ?? 0,
    connectionCount: apiNode.mentions ?? 0,
  };
}

// ── Edge adapter ─────────────────────────────────────────────

export function adaptApiEdge(apiEdge: ApiGraphEdge): GraphRelationship {
  const aiConfidence = apiEdge.ai_confidence_score ??
    (typeof apiEdge.properties?.ai_confidence_score === 'number' ? (apiEdge.properties.ai_confidence_score as number) : undefined) ??
    apiEdge.confidence ??
    (typeof apiEdge.properties?.confidence === 'number' ? (apiEdge.properties.confidence as number) : undefined);

  return {
    id: apiEdge.id,
    source: apiEdge.source,
    target: apiEdge.target,
    type: mapRelationshipType(apiEdge.label),
    directed: true,
    properties: {
      description: apiEdge.evidence || (apiEdge.properties?.description as string | undefined),
      evidenceCount: apiEdge.evidence ? 1 : 0,
      confidence: aiConfidence,
      ai_confidence_score: aiConfidence,
    },
  };
}

// ── Batch converters ─────────────────────────────────────────

export function adaptApiGraph(nodes: ApiGraphNode[], edges: ApiGraphEdge[]): {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
} {
  return {
    nodes: nodes.map(adaptApiNode),
    relationships: edges.map(adaptApiEdge),
  };
}

// ── SuspectProfile → lightweight display record ───────────────

export interface SuspectDisplay {
  id: string;            // name used as id (backend has no int ID)
  name: string;
  aliases: string[];
  role: string;
  mentions: number;
  connections: number;
  associatedCases: string[];
  /** Normalized 0-100 priority score derived from mentions */
  priority: number;
}

export function adaptSuspect(s: SuspectProfile, maxMentions: number): SuspectDisplay {
  return {
    id: s.name,
    name: s.name,
    aliases: s.aliases,
    role: s.master_role,
    mentions: s.mentions,
    connections: s.degree_connections,
    associatedCases: s.associated_cases,
    priority: maxMentions > 0 ? Math.round((s.mentions / maxMentions) * 100) : 0,
  };
}
