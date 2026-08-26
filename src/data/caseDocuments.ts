// ============================================================
// NEXUS — Case Documents Dataset
// SYNTHETIC DEMONSTRATION DATA | SIH26189
// ============================================================

import type { CaseDocument } from '../types';

export const caseDocuments: CaseDocument[] = [
  // ── CASE-2026-014 Documents ────────────────────────────────
  {
    id: 'doc-014-001',
    caseId: 'CASE-2026-014',
    fileName: 'investigation_records_014.pdf',
    fileType: 'application/pdf',
    uploadedAt: '2026-07-01T09:15:00',
    size: 4821342,
    status: 'PROCESSED',
    chunkCount: 189,
    description: 'Primary investigation records including FIR, CDR analysis, and financial intelligence.',
  },
  {
    id: 'doc-014-002',
    caseId: 'CASE-2026-014',
    fileName: 'surveillance_reports_014.pdf',
    fileType: 'application/pdf',
    uploadedAt: '2026-07-08T11:30:00',
    size: 2341104,
    status: 'PROCESSED',
    chunkCount: 54,
    description: 'Consolidated surveillance observation reports across Mumbai, Delhi, Chennai.',
  },

  // ── CASE-2026-011 Documents ────────────────────────────────
  {
    id: 'doc-011-001',
    caseId: 'CASE-2026-011',
    fileName: 'darkstream_intelligence.pdf',
    fileType: 'application/pdf',
    uploadedAt: '2026-06-15T10:45:00',
    size: 3108920,
    status: 'PROCESSED',
    chunkCount: 158,
    description: 'Combined cyber intelligence, CDR analysis, and financial trail for Operation Dark Stream.',
  },

  // ── CASE-2026-009 Documents ────────────────────────────────
  {
    id: 'doc-009-001',
    caseId: 'CASE-2026-009',
    fileName: 'port_smuggling_case_file.pdf',
    fileType: 'application/pdf',
    uploadedAt: '2026-05-20T08:30:00',
    size: 2092741,
    status: 'PROCESSED',
    chunkCount: 107,
    description: 'Port smuggling network investigation including FIR records, surveillance logs, and CDR data.',
  },

  // ── CASE-2026-017 Documents ────────────────────────────────
  {
    id: 'doc-017-001',
    caseId: 'CASE-2026-017',
    fileName: 'real_estate_ml_records.pdf',
    fileType: 'application/pdf',
    uploadedAt: '2026-08-10T11:30:00',
    size: 1823400,
    status: 'PROCESSING',
    chunkCount: 89,
    description: 'Money laundering investigation records — real estate transactions, shell company analysis.',
  },

  // ── CASE-2026-019 Documents ────────────────────────────────
  {
    id: 'doc-019-001',
    caseId: 'CASE-2026-019',
    fileName: 'crossborder_fraud_file.pdf',
    fileType: 'application/pdf',
    uploadedAt: '2026-08-18T09:20:00',
    size: 1441200,
    status: 'PROCESSED',
    chunkCount: 72,
    description: 'Cross-border fraud investigation: trade finance instrument analysis and CDR mapping.',
  },
];

export const getDocumentsByCase = (caseId: string): CaseDocument[] =>
  caseDocuments.filter((d) => d.caseId === caseId);

export const getDocumentById = (docId: string): CaseDocument | undefined =>
  caseDocuments.find((d) => d.id === docId);
