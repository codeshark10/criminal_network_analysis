// ============================================================
// NEXUS CRIMINAL NETWORK INTELLIGENCE SYSTEM
// SIH26189 — AI-Powered Criminal Network Analysis System
// NCRB, Ministry of Home Affairs
// SYNTHETIC DEMONSTRATION DATA — Not real law enforcement data
// ============================================================

export type CaseStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED' | 'UNDER_REVIEW';
export type CasePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type CaseType =
  | 'ORGANIZED_CRIME'
  | 'FINANCIAL_CRIME'
  | 'CYBERCRIME'
  | 'NARCOTICS'
  | 'TERRORISM'
  | 'HUMAN_TRAFFICKING'
  | 'MONEY_LAUNDERING'
  | 'FRAUD';

export type ExtractionStatus =
  | 'NOT_STARTED'
  | 'UPLOADED'
  | 'PROCESSING'
  | 'EXTRACTING_CHUNKS'
  | 'CLASSIFYING'
  | 'EXTRACTING_ENTITIES'
  | 'BUILDING_GRAPH'
  | 'COMPLETED'
  | 'FAILED';

export type ChunkCategory =
  | 'FIR'
  | 'CDR'
  | 'FINANCIAL'
  | 'SURVEILLANCE'
  | 'INTELLIGENCE'
  | 'CRIMINAL_HISTORY'
  | 'SOCIAL_INTELLIGENCE';

export type PersonStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'ARCHIVED' | 'CLEARED';
export type InvestigationPriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type EvidenceType =
  | 'FIR'
  | 'CDR'
  | 'FINANCIAL'
  | 'SURVEILLANCE'
  | 'WIRETAP'
  | 'SOCIAL_INTELLIGENCE'
  | 'CRIMINAL_HISTORY'
  | 'INTELLIGENCE_REPORT'
  | 'PHONE_NUMBERS'
  | 'VEHICLES_AND_WEAPONS';

export type EvidenceStatus = 'PROCESSED' | 'PENDING' | 'FLAGGED' | 'ARCHIVED';

export type AlertSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export type DataSourceType =
  | 'FIR'
  | 'CDR'
  | 'FINANCIAL'
  | 'SURVEILLANCE'
  | 'SOCIAL_INTELLIGENCE'
  | 'CRIMINAL_HISTORY'
  | 'INTELLIGENCE_REPORT';

// ── Case Document ──────────────────────────────────────────────
export interface CaseDocument {
  id: string;
  caseId: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  size: number; // bytes
  status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  chunkCount?: number;
  description?: string;
}

// ── Extracted Chunk ────────────────────────────────────────────
export interface ExtractedChunk {
  id: string;
  caseId: string;
  documentId: string;
  index: number;
  text: string;
  category: ChunkCategory;
  confidence: number; // 0–100
  entities?: string[];
  relationships?: { from: string; type: string; to: string }[];
  createdAt: string;
}

// ── Case ──────────────────────────────────────────────────────
export interface Case {
  id: string;
  name: string;
  type: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  description: string;
  investigatingOfficer: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  personsOfInterestCount: number;
  evidenceCount: number;
  entityCount: number;
  relationshipCount: number;
  networkSize: number;
  outcome?: string;
  tags: string[];
  // Extraction pipeline state
  extractionStatus: ExtractionStatus;
  documentCount: number;
  chunkCounts?: {
    total: number;
    fir: number;
    cdr: number;
    financial: number;
    surveillance: number;
    intelligence: number;
    criminalHistory: number;
    socialIntelligence: number;
  };
}

// ── Person ────────────────────────────────────────────────────
export interface Person {
  id: string;
  name: string;
  aliases: string[];
  status: PersonStatus;
  investigationPriority: number; // 0–100
  priorityLevel: InvestigationPriorityLevel;
  age?: number;
  gender?: string;
  nationality?: string;
  occupation?: string;
  organizations: string[];
  knownLocations: string[];
  vehicleIds: string[];
  phoneNumbers: string[];
  accountIds: string[];
  caseIds: string[];
  evidenceCount: number;
  connectionCount: number;
  networkCentrality: number; // 0–1
  lastObserved?: string;
  notes?: string;
  // Evidence breakdown
  cdrRecords: number;
  financialRecords: number;
  surveillanceReports: number;
  wiretapReferences: number;
  intelligenceReports: number;
}

// ── Organization ──────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  type: string;
  registrationNumber?: string;
  location?: string;
  caseIds: string[];
  personIds: string[];
  evidenceCount: number;
  investigationPriority: number;
  notes?: string;
}

// ── Location ──────────────────────────────────────────────────
export interface Location {
  id: string;
  name: string;
  type: string; // warehouse, residence, office, etc.
  address?: string;
  city: string;
  state?: string;
  coordinates?: { lat: number; lng: number };
  caseIds: string[];
  personIds: string[];
  visitCount: number;
  lastActivity?: string;
}

// ── Phone ─────────────────────────────────────────────────────
export interface Phone {
  id: string;
  number: string;
  carrier?: string;
  personId?: string;
  caseIds: string[];
  callCount: number;
  lastActivity?: string;
}

// ── Vehicle ───────────────────────────────────────────────────
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  color: string;
  registrationNumber: string;
  ownerId?: string;
  caseIds: string[];
  sightingCount: number;
  lastSeen?: string;
  lastLocation?: string;
}

// ── Bank Account ──────────────────────────────────────────────
export interface BankAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
  holderId?: string;
  caseIds: string[];
  totalTransactions: number;
  flagged: boolean;
  balance?: number;
}

// ── Transaction ───────────────────────────────────────────────
export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  fromAccountId: string;
  toAccountId: string;
  date: string;
  type: string;
  caseIds: string[];
  evidenceIds: string[];
  flagged: boolean;
  notes?: string;
}

// ── Evidence ──────────────────────────────────────────────────
export interface Evidence {
  id: string;
  type: EvidenceType;
  status: EvidenceStatus;
  date: string;
  time?: string;
  location?: string;
  city?: string;
  caseIds: string[];
  relatedPersonIds: string[];
  relatedOrgIds: string[];
  relatedLocationIds: string[];
  relatedPhoneIds: string[];
  relatedVehicleIds: string[];
  relatedTransactionIds: string[];
  confidence: number; // 0–100
  source: string;
  summary: string;
  extractedRelationships: string[];
  flagged: boolean;
}

// ── Event ─────────────────────────────────────────────────────
export interface InvestigationEvent {
  id: string;
  type: string;
  timestamp: string;
  date: string;
  time: string;
  description: string;
  caseIds: string[];
  personIds: string[];
  locationId?: string;
  evidenceIds: string[];
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ── Alert ─────────────────────────────────────────────────────
export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  caseId?: string;
  personIds: string[];
  evidenceIds: string[];
  detectedAt: string;
  acknowledgedAt?: string;
  category: string;
}

// ── Data Source ───────────────────────────────────────────────
export interface DataSource {
  id: string;
  type: DataSourceType;
  name: string;
  description: string;
  recordCount: number;
  processedCount: number;
  pendingCount: number;
  lastUpdated: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  caseIds: string[];
}

// ── Investigation Candidate ───────────────────────────────────
export interface InvestigationCandidate {
  personId: string;
  rank: number;
  priority: number; // 0–100
  priorityLevel: InvestigationPriorityLevel;
  networkCentrality: number;
  crossSourceEvidence: number;
  financialIndicators: number;
  communicationPatterns: number;
  locationCorrelation: number;
  behavioralAnomalies: number;
  reasons: string[];
  evidenceCount: number;
  connectionCount: number;
}

// ── Analytics ─────────────────────────────────────────────────
export interface NetworkMetrics {
  nodeCount: number;
  edgeCount: number;
  density: number;
  avgDegree: number;
  communityCount: number;
  bridgeNodes: number;
  isolatedNodes: number;
  maxCentrality: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}
