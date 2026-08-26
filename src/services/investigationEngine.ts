// ============================================================
// NEXUS — Investigation Engine (Frontend Simulation)
// Deterministic analysis simulation for SIH26189 demo
// ============================================================

import type { InvestigationCandidate } from '../types';
import { persons } from '../data/persons';
import { graphNodes } from '../data/graphNodes';
import { graphRelationships } from '../data/graphRelationships';
import type { GraphData } from '../types/graph';

// Analysis step type
export interface AnalysisStep {
  id: string;
  label: string;
  detail: string;
  durationMs: number;
}

// Known Suspect analysis steps
export const knownSuspectSteps: AnalysisStep[] = [
  { id: 'init', label: 'INITIALIZING ANALYSIS ENGINE', detail: 'Case loaded', durationMs: 600 },
  { id: 'parse', label: 'PARSING INTELLIGENCE', detail: '342 records processed', durationMs: 900 },
  { id: 'extract', label: 'ENTITY EXTRACTION', detail: '687 entities identified', durationMs: 800 },
  { id: 'resolve', label: 'ENTITY RESOLUTION', detail: '103 duplicate entities resolved', durationMs: 700 },
  { id: 'graph', label: 'GRAPH CONSTRUCTION', detail: '1,492 relationships mapped', durationMs: 1000 },
  { id: 'network', label: 'NETWORK ANALYSIS', detail: '18 communities identified', durationMs: 900 },
  { id: 'candidates', label: 'CANDIDATE RANKING', detail: '17 investigation candidates identified', durationMs: 700 },
];

// Unknown Case analysis steps
export const unknownCaseSteps: AnalysisStep[] = [
  { id: 'init', label: 'INITIALIZING ANALYSIS ENGINE', detail: 'Case data loaded', durationMs: 600 },
  { id: 'parse', label: 'PARSING INTELLIGENCE', detail: '342 evidence records processed', durationMs: 900 },
  { id: 'extract', label: 'ENTITY EXTRACTION', detail: '687 entities identified', durationMs: 800 },
  { id: 'resolve', label: 'ENTITY RESOLUTION', detail: '103 duplicate entities resolved', durationMs: 700 },
  { id: 'graph', label: 'GRAPH CONSTRUCTION', detail: '1,492 relationships mapped', durationMs: 1000 },
  { id: 'network', label: 'NETWORK ANALYSIS', detail: '18 communities identified', durationMs: 900 },
  { id: 'anomaly', label: 'ANOMALY DETECTION', detail: '23 suspicious patterns identified', durationMs: 800 },
  { id: 'candidates', label: 'CANDIDATE RANKING', detail: '17 investigation candidates identified', durationMs: 700 },
];

// Investigation candidates for CASE-2026-014
export const investigationCandidates: InvestigationCandidate[] = [
  { personId: 'person-001', rank: 1, priority: 94, priorityLevel: 'HIGH', networkCentrality: 18, crossSourceEvidence: 22, financialIndicators: 19, communicationPatterns: 17, locationCorrelation: 12, behavioralAnomalies: 6, reasons: ['Highest network centrality (0.81)', 'Evidence across 5 source types', 'Cross-cluster financial connections', 'Communication spike (37 calls / 2h)', 'Observed at key locations multiple times'], evidenceCount: 24, connectionCount: 17 },
  { personId: 'person-002', rank: 2, priority: 92, priorityLevel: 'HIGH', networkCentrality: 16, crossSourceEvidence: 20, financialIndicators: 18, communicationPatterns: 15, locationCorrelation: 14, behavioralAnomalies: 9, reasons: ['Direct communication with primary suspect', 'Financial routing confirmed (CDR + Financial)', 'Repeated co-location with network hub', 'Flagged account activity'], evidenceCount: 18, connectionCount: 12 },
  { personId: 'person-003', rank: 3, priority: 84, priorityLevel: 'HIGH', networkCentrality: 15, crossSourceEvidence: 17, financialIndicators: 16, communicationPatterns: 14, locationCorrelation: 11, behavioralAnomalies: 11, reasons: ['Bridge node between two clusters', 'Late-night communication pattern', 'Multiple location sightings', 'Import-export access'], evidenceCount: 14, connectionCount: 10 },
  { personId: 'person-004', rank: 4, priority: 77, priorityLevel: 'HIGH', networkCentrality: 12, crossSourceEvidence: 16, financialIndicators: 19, communicationPatterns: 11, locationCorrelation: 9, behavioralAnomalies: 10, reasons: ['Manages flagged financial accounts', 'Received large cross-network transfer', 'Financial record discrepancy', 'Associated with Apex Holdings'], evidenceCount: 11, connectionCount: 8 },
  { personId: 'person-005', rank: 5, priority: 69, priorityLevel: 'MEDIUM', networkCentrality: 10, crossSourceEvidence: 13, financialIndicators: 11, communicationPatterns: 12, locationCorrelation: 13, behavioralAnomalies: 10, reasons: ['Connected to secondary network cluster', 'Regular contact with bridge node', 'Location overlap with known associates'], evidenceCount: 8, connectionCount: 6 },
  { personId: 'person-006', rank: 6, priority: 61, priorityLevel: 'MEDIUM', networkCentrality: 9, crossSourceEvidence: 12, financialIndicators: 8, communicationPatterns: 10, locationCorrelation: 14, behavioralAnomalies: 8, reasons: ['Warehouse operator with frequent access', 'Repeated co-location with primary suspect', 'CDR confirms communication pattern'], evidenceCount: 7, connectionCount: 5 },
  { personId: 'person-020', rank: 7, priority: 66, priorityLevel: 'MEDIUM', networkCentrality: 10, crossSourceEvidence: 14, financialIndicators: 12, communicationPatterns: 9, locationCorrelation: 13, behavioralAnomalies: 8, reasons: ['Port inspector with privileged access', 'Financial discrepancy identified', 'Multiple sightings at JN Port with known suspects'], evidenceCount: 10, connectionCount: 5 },
];

// Simulate known suspect network analysis
export const analyzeKnownSuspect = (personId: string): GraphData => {
  const centerNode = graphNodes.find((n) => n.id === personId);
  if (!centerNode) return { nodes: [], relationships: [] };

  const directRelationships = graphRelationships.filter(
    (r) => r.source === personId || r.target === personId
  );

  const connectedNodeIds = new Set<string>();
  connectedNodeIds.add(personId);
  directRelationships.forEach((r) => {
    connectedNodeIds.add(r.source as string);
    connectedNodeIds.add(r.target as string);
  });

  const nodes = graphNodes.filter((n) => connectedNodeIds.has(n.id));
  return { nodes, relationships: directRelationships };
};

// Get expanded graph at depth
export const getNetworkAtDepth = (centerId: string, depth: number): GraphData => {
  const visitedIds = new Set<string>();
  const activeIds = new Set<string>([centerId]);
  const collectedRelationships: typeof graphRelationships = [];

  for (let d = 0; d < depth; d++) {
    const nextIds = new Set<string>();
    activeIds.forEach((nodeId) => {
      if (visitedIds.has(nodeId)) return;
      visitedIds.add(nodeId);
      const rels = graphRelationships.filter(
        (r) => r.source === nodeId || r.target === nodeId
      );
      rels.forEach((r) => {
        collectedRelationships.push(r);
        const otherId = r.source === nodeId ? (r.target as string) : (r.source as string);
        if (!visitedIds.has(otherId)) nextIds.add(otherId);
      });
    });
    nextIds.forEach((id) => activeIds.add(id));
  }

  const allNodeIds = new Set<string>();
  collectedRelationships.forEach((r) => {
    allNodeIds.add(r.source as string);
    allNodeIds.add(r.target as string);
  });

  const nodes = graphNodes.filter((n) => allNodeIds.has(n.id));
  // Deduplicate relationships
  const uniqueRels = Array.from(new Map(collectedRelationships.map((r) => [r.id, r])).values());

  return { nodes, relationships: uniqueRels };
};

// Calculate investigation priority (deterministic)
export const calculateInvestigationPriority = (personId: string): number => {
  const person = persons.find((p) => p.id === personId);
  if (!person) return 0;
  return person.investigationPriority;
};

// Get connected entities for a node
export const getConnectedEntities = (nodeId: string): { node: typeof graphNodes[0]; relationship: typeof graphRelationships[0] }[] => {
  const rels = graphRelationships.filter((r) => r.source === nodeId || r.target === nodeId);
  return rels.map((r) => {
    const otherId = r.source === nodeId ? (r.target as string) : (r.source as string);
    const node = graphNodes.find((n) => n.id === otherId);
    return node ? { node, relationship: r } : null;
  }).filter(Boolean) as { node: typeof graphNodes[0]; relationship: typeof graphRelationships[0] }[];
};

// Get candidates for a case
export const getCandidates = (_caseId: string): InvestigationCandidate[] => {
  return investigationCandidates;
};

// Simulate unknown case analysis — returns full case network
export const analyzeUnknownCase = (caseId: string): GraphData => {
  const caseNodes = graphNodes.filter((n) => n.caseIds.includes(caseId));
  const caseNodeIds = new Set(caseNodes.map((n) => n.id));
  const caseRelationships = graphRelationships.filter(
    (r) => caseNodeIds.has(r.source as string) && caseNodeIds.has(r.target as string)
  );
  return { nodes: caseNodes, relationships: caseRelationships };
};
