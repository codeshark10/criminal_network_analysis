// ============================================================
// NEXUS — Cases Dataset
// SYNTHETIC DEMONSTRATION DATA | SIH26189
// ============================================================

import type { Case } from '../types';

export const cases: Case[] = [
  // ── ACTIVE CASES ──────────────────────────────────────────
  {
    id: 'CASE-2026-014',
    name: 'Organized Financial Network',
    type: 'FINANCIAL_CRIME',
    status: 'ACTIVE',
    priority: 'HIGH',
    description:
      'Investigation into a multi-layered organized financial crime network operating through logistics and trade finance entities across major Indian port cities. Network involves structured financial transfers, suspected front companies, and multiple persons of interest.',
    investigatingOfficer: 'ACP Sudhir Krishnan',
    createdAt: '2026-07-01T09:00:00',
    updatedAt: '2026-08-25T14:03:00',
    personsOfInterestCount: 17,
    evidenceCount: 342,
    entityCount: 687,
    relationshipCount: 1492,
    networkSize: 23,
    tags: ['financial-crime', 'organized-crime', 'port-operations', 'money-laundering'],
    extractionStatus: 'COMPLETED',
    documentCount: 2,
    chunkCounts: {
      total: 243,
      fir: 24,
      cdr: 87,
      financial: 42,
      surveillance: 31,
      intelligence: 18,
      criminalHistory: 12,
      socialIntelligence: 29,
    },
  },
  {
    id: 'CASE-2026-011',
    name: 'Operation Dark Stream',
    type: 'CYBERCRIME',
    status: 'ACTIVE',
    priority: 'CRITICAL',
    description:
      'Investigation into a cybercrime network suspected of operating ransomware attacks on critical infrastructure and financial institutions. Key actors identified in Bengaluru tech corridor.',
    investigatingOfficer: 'DCP Nandita Rao',
    createdAt: '2026-06-15T10:30:00',
    updatedAt: '2026-08-25T02:14:00',
    personsOfInterestCount: 8,
    evidenceCount: 178,
    entityCount: 312,
    relationshipCount: 704,
    networkSize: 11,
    tags: ['cybercrime', 'ransomware', 'critical-infrastructure'],
    extractionStatus: 'COMPLETED',
    documentCount: 1,
    chunkCounts: {
      total: 158,
      fir: 12,
      cdr: 44,
      financial: 28,
      surveillance: 18,
      intelligence: 31,
      criminalHistory: 9,
      socialIntelligence: 16,
    },
  },
  {
    id: 'CASE-2026-009',
    name: 'Port Smuggling Network',
    type: 'ORGANIZED_CRIME',
    status: 'ACTIVE',
    priority: 'HIGH',
    description:
      'Investigation into a smuggling network exploiting port security vulnerabilities at major southern Indian ports. Suspected links to existing financial crime network.',
    investigatingOfficer: 'SP Ramesh Pillai',
    createdAt: '2026-05-20T08:00:00',
    updatedAt: '2026-08-22T12:00:00',
    personsOfInterestCount: 6,
    evidenceCount: 121,
    entityCount: 203,
    relationshipCount: 441,
    networkSize: 8,
    tags: ['smuggling', 'port-crime', 'organized-crime'],
    extractionStatus: 'COMPLETED',
    documentCount: 1,
    chunkCounts: {
      total: 107,
      fir: 18,
      cdr: 29,
      financial: 14,
      surveillance: 22,
      intelligence: 11,
      criminalHistory: 7,
      socialIntelligence: 6,
    },
  },
  {
    id: 'CASE-2026-017',
    name: 'Money Laundering — Real Estate',
    type: 'MONEY_LAUNDERING',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    description:
      'Investigation into suspected money laundering through shell real estate companies in Pune and Mumbai. Multiple suspicious property transactions flagged.',
    investigatingOfficer: 'ACP Prerna Malhotra',
    createdAt: '2026-08-10T11:00:00',
    updatedAt: '2026-08-20T10:30:00',
    personsOfInterestCount: 4,
    evidenceCount: 67,
    entityCount: 134,
    relationshipCount: 289,
    networkSize: 5,
    tags: ['money-laundering', 'real-estate'],
    extractionStatus: 'EXTRACTING_ENTITIES',
    documentCount: 1,
    chunkCounts: {
      total: 89,
      fir: 8,
      cdr: 12,
      financial: 34,
      surveillance: 11,
      intelligence: 9,
      criminalHistory: 4,
      socialIntelligence: 11,
    },
  },
  {
    id: 'CASE-2026-019',
    name: 'Cross-Border Fraud Investigation',
    type: 'FRAUD',
    status: 'UNDER_REVIEW',
    priority: 'MEDIUM',
    description:
      'Investigation into suspected cross-border fraud operations involving trade finance instruments and documentary credit manipulation.',
    investigatingOfficer: 'DSP Kumar Singh',
    createdAt: '2026-08-18T09:00:00',
    updatedAt: '2026-08-24T15:00:00',
    personsOfInterestCount: 3,
    evidenceCount: 42,
    entityCount: 89,
    relationshipCount: 172,
    networkSize: 4,
    tags: ['fraud', 'trade-finance', 'cross-border'],
    extractionStatus: 'COMPLETED',
    documentCount: 1,
    chunkCounts: {
      total: 72,
      fir: 6,
      cdr: 19,
      financial: 22,
      surveillance: 8,
      intelligence: 7,
      criminalHistory: 4,
      socialIntelligence: 6,
    },
  },
  // ── PAST CASES ────────────────────────────────────────────
  {
    id: 'CASE-2026-008',
    name: 'Synthetic Intelligence Investigation',
    type: 'ORGANIZED_CRIME',
    status: 'CLOSED',
    priority: 'HIGH',
    description:
      'Investigation into a network of entities using synthetic identity manipulation to perpetrate large-scale fraud. Case closed after successful evidence gathering and referral.',
    investigatingOfficer: 'ACP Sudhir Krishnan',
    createdAt: '2026-03-01T09:00:00',
    updatedAt: '2026-06-30T17:00:00',
    closedAt: '2026-06-30T17:00:00',
    personsOfInterestCount: 12,
    evidenceCount: 147,
    entityCount: 291,
    relationshipCount: 602,
    networkSize: 14,
    outcome: 'Case referred to prosecution. 4 persons of interest confirmed for further legal proceedings.',
    tags: ['organized-crime', 'identity-fraud', 'closed'],
    extractionStatus: 'COMPLETED',
    documentCount: 3,
    chunkCounts: {
      total: 198,
      fir: 22,
      cdr: 54,
      financial: 41,
      surveillance: 28,
      intelligence: 24,
      criminalHistory: 14,
      socialIntelligence: 15,
    },
  },
  {
    id: 'CASE-2026-003',
    name: 'Financial Channel Disruption',
    type: 'MONEY_LAUNDERING',
    status: 'CLOSED',
    priority: 'CRITICAL',
    description:
      'Investigation into an illegal financial channel used to move proceeds of crime across multiple jurisdictions.',
    investigatingOfficer: 'SP Vikram Tiwari',
    createdAt: '2026-01-10T08:00:00',
    updatedAt: '2026-05-15T16:00:00',
    closedAt: '2026-05-15T16:00:00',
    personsOfInterestCount: 9,
    evidenceCount: 203,
    entityCount: 398,
    relationshipCount: 811,
    networkSize: 18,
    outcome: 'Investigation concluded. Network disrupted. Assets identified for recovery proceedings.',
    tags: ['money-laundering', 'financial-crime', 'closed'],
    extractionStatus: 'COMPLETED',
    documentCount: 4,
    chunkCounts: {
      total: 312,
      fir: 29,
      cdr: 91,
      financial: 82,
      surveillance: 44,
      intelligence: 31,
      criminalHistory: 18,
      socialIntelligence: 17,
    },
  },
  {
    id: 'CASE-2025-091',
    name: 'Narcotics Logistics Network',
    type: 'NARCOTICS',
    status: 'ARCHIVED',
    priority: 'HIGH',
    description:
      'Historic investigation into a narcotics distribution network utilizing logistics infrastructure. Archived after conclusion.',
    investigatingOfficer: 'ACP Gopinath Menon',
    createdAt: '2025-09-01T09:00:00',
    updatedAt: '2025-12-31T17:00:00',
    closedAt: '2025-12-31T17:00:00',
    personsOfInterestCount: 21,
    evidenceCount: 389,
    entityCount: 712,
    relationshipCount: 1841,
    networkSize: 31,
    outcome: 'Investigation concluded. Archived.',
    tags: ['narcotics', 'logistics', 'archived'],
    extractionStatus: 'COMPLETED',
    documentCount: 5,
    chunkCounts: {
      total: 421,
      fir: 48,
      cdr: 112,
      financial: 63,
      surveillance: 88,
      intelligence: 52,
      criminalHistory: 34,
      socialIntelligence: 24,
    },
  },
  {
    id: 'CASE-2026-010',
    name: 'Social Media Fraud Network',
    type: 'FRAUD',
    status: 'UNDER_REVIEW',
    priority: 'LOW',
    description:
      'Investigation into a social media-based fraud network targeting financial institutions. Under review pending additional intelligence.',
    investigatingOfficer: 'SI Deepak Nath',
    createdAt: '2026-07-20T10:00:00',
    updatedAt: '2026-08-15T14:00:00',
    personsOfInterestCount: 5,
    evidenceCount: 53,
    entityCount: 98,
    relationshipCount: 189,
    networkSize: 6,
    tags: ['fraud', 'social-media', 'under-review'],
    extractionStatus: 'NOT_STARTED',
    documentCount: 0,
  },
];

export const addCase = (newCase: Case) => {
  cases.unshift(newCase);
};

export const getCaseById = (id: string): Case | undefined =>
  cases.find((c) => c.id === id);

export const getActiveCases = (): Case[] =>
  cases.filter((c) => c.status === 'ACTIVE');

export const getPastCases = (): Case[] =>
  cases.filter((c) => c.status === 'CLOSED' || c.status === 'ARCHIVED');

export const getUnderReviewCases = (): Case[] =>
  cases.filter((c) => c.status === 'UNDER_REVIEW');

export const getGlobalStats = () => {
  const total = cases.length;
  const active = cases.filter((c) => c.status === 'ACTIVE').length;
  const closed = cases.filter((c) => c.status === 'CLOSED' || c.status === 'ARCHIVED').length;
  const underReview = cases.filter((c) => c.status === 'UNDER_REVIEW').length;
  const totalPersons = cases.reduce((sum, c) => sum + c.personsOfInterestCount, 0);
  const totalEvidence = cases.reduce((sum, c) => sum + c.evidenceCount, 0);
  const totalEntities = cases.reduce((sum, c) => sum + c.entityCount, 0);
  const totalRelationships = cases.reduce((sum, c) => sum + c.relationshipCount, 0);
  const totalChunks = cases.reduce((sum, c) => sum + (c.chunkCounts?.total ?? 0), 0);
  return { total, active, closed, underReview, totalPersons, totalEvidence, totalEntities, totalRelationships, totalChunks };
};
