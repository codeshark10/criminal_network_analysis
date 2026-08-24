import { alerts, candidates, cases, entities, evidence, persons, relationships, timeline } from '../data/mockData'
import type { EntityType, InvestigationCandidate, Relationship } from '../types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const caseService = {
  getCases: async () => cases,
  getCase: async (id: string) => cases.find(item => item.id === id),
}

export const personService = {
  getPersons: async () => persons,
  getPerson: async (id: string) => persons.find(item => item.id === id),
  getCandidates: async () => candidates,
}

export const evidenceService = {
  getEvidence: async () => evidence,
  getById: async (id: string) => evidence.find(item => item.id === id),
}

export const networkService = {
  getNetwork: async (filters?: EntityType[]) => ({ nodes: filters?.length ? entities.filter(entity => filters.includes(entity.type)) : entities, relationships }),
  getConnectedEntities: (id: string, depth = 1) => {
    const found = new Set([id]); let frontier = new Set([id])
    for (let step = 0; step < depth; step += 1) { const next = new Set<string>(); relationships.forEach(link => { if (frontier.has(link.source)) next.add(link.target); if (frontier.has(link.target)) next.add(link.source) }); next.forEach(item => found.add(item)); frontier = next }
    return { nodes: entities.filter(item => found.has(item.id)), relationships: relationships.filter(link => found.has(link.source) && found.has(link.target)) }
  },
  getRelationship: (id: string): Relationship | undefined => relationships.find(item => item.id === id),
}

export const analyticsService = { getAlerts: async () => alerts, getTimeline: async () => timeline }

export async function analyzeKnownSuspect(personId: string): Promise<InvestigationCandidate[]> { await delay(250); return personId === 'person-001' ? candidates : candidates.slice(1) }
export async function analyzeUnknownCase(): Promise<InvestigationCandidate[]> { await delay(250); return [{ ...candidates[0], personId: 'person-001', score: 94, priority: 'HIGH', relationship: 'High network centrality and multi-source convergence' }, ...candidates] }
