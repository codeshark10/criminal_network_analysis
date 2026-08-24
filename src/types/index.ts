export type EntityType = 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'PHONE' | 'VEHICLE' | 'ACCOUNT' | 'TRANSACTION' | 'EVENT'
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Entity {
  id: string
  type: EntityType
  label: string
  properties: Record<string, string | number | boolean | string[]>
  caseIds: string[]
}

export interface Person extends Entity {
  type: 'PERSON'
  properties: Entity['properties'] & {
    alias: string
    priority: number
    role: string
    status: string
    locations: string[]
    evidenceCount: number
  }
}

export interface Relationship {
  id: string
  source: string
  target: string
  type: 'COMMUNICATED_WITH' | 'ASSOCIATED_WITH' | 'LOCATED_AT' | 'USED' | 'TRANSFERRED_TO' | 'OBSERVED_AT' | 'OWNED_BY' | 'MENTIONED_IN'
  properties: { evidenceCount: number; confidence: number; lastObserved: string }
}

export interface CaseFile {
  id: string
  name: string
  type: string
  status: 'ACTIVE' | 'UNDER REVIEW' | 'CLOSED'
  priority: Priority
  persons: number
  evidence: number
  relationships: number
  entities: number
  locations: number
  financialEvents: number
  lastActivity: string
}

export interface Evidence {
  id: string
  type: 'FIR' | 'CDR' | 'FINANCIAL' | 'SURVEILLANCE' | 'WIRETAP' | 'SOCIAL' | 'CRIMINAL HISTORY' | 'INTELLIGENCE REPORT'
  date: string
  entities: string[]
  location: string
  status: 'Processed' | 'Under review' | 'Verified'
  confidence: number
  source: string
  caseId: string
  summary: string
}

export interface InvestigationCandidate {
  personId: string
  score: number
  priority: Priority
  relationship: string
  evidenceSources: string[]
  evidenceCount: number
  connections: number
  lastActivity: string
  indicators: string[]
  rationale: { label: string; value: number }[]
}

export interface Alert {
  id: string
  priority: Priority
  title: string
  subject: string
  description: string
  timestamp: string
  relatedId: string
}

export interface TimelineEvent {
  id: string
  time: string
  date: string
  title: string
  description: string
  type: 'Communication' | 'Financial' | 'Surveillance' | 'Location' | 'Association'
  entityIds: string[]
  location: string
}
