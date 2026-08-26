// ============================================================
// NEXUS — Neo4j-Compatible Graph Types
// SIH26189 | SYNTHETIC DEMONSTRATION DATA
// ============================================================

export type EntityType =
  | 'PERSON'
  | 'ORGANIZATION'
  | 'LOCATION'
  | 'PHONE'
  | 'VEHICLE'
  | 'BANK_ACCOUNT'
  | 'TRANSACTION'
  | 'EVENT'
  | 'EVIDENCE'
  | 'CASE';

export type RelationshipType =
  | 'COMMUNICATED_WITH'
  | 'ASSOCIATED_WITH'
  | 'LOCATED_AT'
  | 'USES'
  | 'OWNS'
  | 'OWNED_BY'
  | 'TRANSFERRED'
  | 'RECEIVED'
  | 'INVOLVED_IN'
  | 'OBSERVED_AT'
  | 'WORKS_FOR'
  | 'MEETING_WITH'
  | 'MENTIONED_IN'
  | 'CONNECTED_TO'
  | 'RELATED_TO'
  | 'PART_OF';

// Compatible with Neo4j property graph model
export interface GraphNode {
  id: string;
  labels: string[]; // Neo4j supports multiple labels
  type: EntityType;
  displayName: string;
  properties: Record<string, unknown>;
  caseIds: string[];
  // Graph layout (set by D3)
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  // Investigation relevance
  investigationPriority?: number;
  evidenceCount?: number;
  connectionCount?: number;
}

export interface GraphRelationship {
  id: string;
  source: string; // GraphNode id
  target: string; // GraphNode id
  type: RelationshipType;
  directed: boolean;
  properties: {
    confidence?: number;
    evidenceCount?: number;
    evidenceIds?: string[];
    firstObserved?: string;
    lastObserved?: string;
    description?: string;
    amount?: number;
    frequency?: number;
  };
}

// For D3 force simulation — source/target become node references
export interface SimulationNode extends GraphNode {
  index?: number;
}

export interface SimulationLink extends Omit<GraphRelationship, 'source' | 'target'> {
  source: SimulationNode | string;
  target: SimulationNode | string;
}

export interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

export interface ExpandedGraph {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  centerNodeId: string;
  depth: number;
}

// Layout types
export type GraphLayout = 'FORCE' | 'HIERARCHICAL' | 'RADIAL';

// Filter state
export interface GraphFilters {
  entityTypes: EntityType[];
  relationshipTypes: RelationshipType[];
  minConfidence: number;
  caseIds: string[];
}
