// ============================================================
// NEXUS — Graph Nodes (Neo4j Compatible)
// SYNTHETIC DEMONSTRATION DATA | SIH26189
// ============================================================

import type { GraphNode } from '../types/graph';

export const graphNodes: GraphNode[] = [
  // ── PERSONS ───────────────────────────────────────────────
  { id: 'person-001', labels: ['Person'], type: 'PERSON', displayName: 'Marcus Thorne', properties: { name: 'Marcus Thorne', alias: 'Enforcer', investigationPriority: 94, evidenceCount: 24, occupation: 'Logistics Consultant', caseId: 'CASE-2026-014' }, caseIds: ['CASE-2026-014', 'CASE-2026-008'], investigationPriority: 94, evidenceCount: 24, connectionCount: 17 },
  { id: 'person-002', labels: ['Person'], type: 'PERSON', displayName: 'Sarah Lin', properties: { name: 'Sarah Lin', alias: 'Lin', investigationPriority: 92, evidenceCount: 18, occupation: 'Financial Analyst', caseId: 'CASE-2026-014' }, caseIds: ['CASE-2026-014'], investigationPriority: 92, evidenceCount: 18, connectionCount: 12 },
  { id: 'person-003', labels: ['Person'], type: 'PERSON', displayName: 'Victor Hale', properties: { name: 'Victor Hale', alias: 'Hale', investigationPriority: 84, evidenceCount: 14, occupation: 'Import-Export Manager', caseId: 'CASE-2026-014' }, caseIds: ['CASE-2026-014'], investigationPriority: 84, evidenceCount: 14, connectionCount: 10 },
  { id: 'person-004', labels: ['Person'], type: 'PERSON', displayName: 'Carlos Mendez', properties: { name: 'Carlos Mendez', alias: 'CM', investigationPriority: 77, evidenceCount: 11, occupation: 'Accountant', caseId: 'CASE-2026-014' }, caseIds: ['CASE-2026-014'], investigationPriority: 77, evidenceCount: 11, connectionCount: 8 },
  { id: 'person-005', labels: ['Person'], type: 'PERSON', displayName: 'Elena Rostova', properties: { name: 'Elena Rostova', alias: 'Rostova', investigationPriority: 69, evidenceCount: 8, occupation: 'Operations Coordinator', caseId: 'CASE-2026-014' }, caseIds: ['CASE-2026-014'], investigationPriority: 69, evidenceCount: 8, connectionCount: 6 },
  { id: 'person-006', labels: ['Person'], type: 'PERSON', displayName: 'David Park', properties: { name: 'David Park', alias: 'Park', investigationPriority: 61, evidenceCount: 7, occupation: 'Warehouse Operator', caseId: 'CASE-2026-014' }, caseIds: ['CASE-2026-014'], investigationPriority: 61, evidenceCount: 7, connectionCount: 5 },
  { id: 'person-013', labels: ['Person'], type: 'PERSON', displayName: 'Omar Shaikh', properties: { name: 'Omar Shaikh', alias: 'O. Shaikh', investigationPriority: 63, evidenceCount: 9, occupation: 'Trader', caseId: 'CASE-2026-014' }, caseIds: ['CASE-2026-014', 'CASE-2026-009'], investigationPriority: 63, evidenceCount: 9, connectionCount: 6 },
  { id: 'person-015', labels: ['Person'], type: 'PERSON', displayName: 'Harish Nair', properties: { name: 'Harish Nair', alias: 'H. Nair', investigationPriority: 57, evidenceCount: 8, occupation: 'Transport Manager', caseId: 'CASE-2026-014' }, caseIds: ['CASE-2026-014'], investigationPriority: 57, evidenceCount: 8, connectionCount: 6 },
  { id: 'person-020', labels: ['Person'], type: 'PERSON', displayName: 'Rohan Bose', properties: { name: 'Rohan Bose', alias: 'R. Bose', investigationPriority: 66, evidenceCount: 10, occupation: 'Port Inspector', caseId: 'CASE-2026-014' }, caseIds: ['CASE-2026-014'], investigationPriority: 66, evidenceCount: 10, connectionCount: 5 },
  // ── ORGANIZATIONS ─────────────────────────────────────────
  { id: 'org-001', labels: ['Organization'], type: 'ORGANIZATION', displayName: 'Apex Freight Intl.', properties: { name: 'Apex Freight International', type: 'Logistics Company', investigationPriority: 87, evidenceCount: 12 }, caseIds: ['CASE-2026-014'], investigationPriority: 87, evidenceCount: 12, connectionCount: 8 },
  { id: 'org-002', labels: ['Organization'], type: 'ORGANIZATION', displayName: 'Apex Holdings', properties: { name: 'Apex Holdings Pvt. Ltd.', type: 'Private Company', investigationPriority: 76 }, caseIds: ['CASE-2026-014'], investigationPriority: 76, evidenceCount: 8, connectionCount: 4 },
  { id: 'org-003', labels: ['Organization'], type: 'ORGANIZATION', displayName: 'Pacific Trading Co.', properties: { name: 'Pacific Trading Co.', type: 'Trading Company', investigationPriority: 65 }, caseIds: ['CASE-2026-014'], investigationPriority: 65, evidenceCount: 7, connectionCount: 4 },
  // ── LOCATIONS ─────────────────────────────────────────────
  { id: 'loc-001', labels: ['Location'], type: 'LOCATION', displayName: 'Dharavi Warehouse', properties: { name: 'Dharavi Warehouse Complex', city: 'Mumbai', type: 'Warehouse', visitCount: 24 }, caseIds: ['CASE-2026-014'], connectionCount: 5 },
  { id: 'loc-002', labels: ['Location'], type: 'LOCATION', displayName: 'Nehru Place Office', properties: { name: 'Nehru Place Office Complex', city: 'Delhi', type: 'Office', visitCount: 18 }, caseIds: ['CASE-2026-014'], connectionCount: 3 },
  { id: 'loc-007', labels: ['Location'], type: 'LOCATION', displayName: 'JN Port Complex', properties: { name: 'Jawaharlal Nehru Port', city: 'Mumbai', type: 'Port', visitCount: 31 }, caseIds: ['CASE-2026-014'], connectionCount: 6 },
  { id: 'loc-004', labels: ['Location'], type: 'LOCATION', displayName: 'Ambattur Estate', properties: { name: 'Ambattur Industrial Estate', city: 'Chennai', type: 'Industrial', visitCount: 14 }, caseIds: ['CASE-2026-014'], connectionCount: 3 },
  // ── PHONES ────────────────────────────────────────────────
  { id: 'phone-001', labels: ['Phone'], type: 'PHONE', displayName: '+91-97712-55012', properties: { number: '+91-97712-55012', carrier: 'Airtel', callCount: 84 }, caseIds: ['CASE-2026-014'], connectionCount: 2 },
  { id: 'phone-003', labels: ['Phone'], type: 'PHONE', displayName: '+91-88001-34451', properties: { number: '+91-88001-34451', carrier: 'Vodafone', callCount: 61 }, caseIds: ['CASE-2026-014'], connectionCount: 2 },
  { id: 'phone-004', labels: ['Phone'], type: 'PHONE', displayName: '+91-97733-71110', properties: { number: '+91-97733-71110', carrier: 'Airtel', callCount: 47 }, caseIds: ['CASE-2026-014'], connectionCount: 2 },
  // ── VEHICLES ──────────────────────────────────────────────
  { id: 'vehicle-001', labels: ['Vehicle'], type: 'VEHICLE', displayName: 'Silver Audi Q7', properties: { make: 'Audi', model: 'Q7', color: 'Silver', registration: 'MH-01-AX-7821', sightingCount: 14 }, caseIds: ['CASE-2026-014'], connectionCount: 2 },
  { id: 'vehicle-003', labels: ['Vehicle'], type: 'VEHICLE', displayName: 'Black Toyota Innova', properties: { make: 'Toyota', model: 'Innova', color: 'Black', registration: 'TN-09-GH-4401', sightingCount: 11 }, caseIds: ['CASE-2026-014'], connectionCount: 2 },
  // ── ACCOUNTS ──────────────────────────────────────────────
  { id: 'account-001', labels: ['BankAccount'], type: 'BANK_ACCOUNT', displayName: 'ACC-00712-HDFC', properties: { accountNumber: 'ACC-00712-HDFC', bank: 'HDFC Bank', type: 'Current', flagged: true, transactions: 47 }, caseIds: ['CASE-2026-014'], connectionCount: 3 },
  { id: 'account-003', labels: ['BankAccount'], type: 'BANK_ACCOUNT', displayName: 'ACC-01124-SBI', properties: { accountNumber: 'ACC-01124-SBI', bank: 'SBI', type: 'Current', flagged: true, transactions: 31 }, caseIds: ['CASE-2026-014'], connectionCount: 2 },
  // ── TRANSACTIONS ──────────────────────────────────────────
  { id: 'tx-001', labels: ['Transaction'], type: 'TRANSACTION', displayName: 'TX-00124', properties: { txId: 'TX-00124', amount: 3270000, currency: 'INR', date: '2026-08-10', type: 'Bank Transfer', flagged: true }, caseIds: ['CASE-2026-014'], connectionCount: 2 },
  { id: 'tx-002', labels: ['Transaction'], type: 'TRANSACTION', displayName: 'TX-00281', properties: { txId: 'TX-00281', amount: 39700000, currency: 'INR', date: '2026-08-18', type: 'Cross-Network Transfer', flagged: true }, caseIds: ['CASE-2026-014'], connectionCount: 3 },
  // ── EVIDENCE ──────────────────────────────────────────────
  { id: 'ev-00124', labels: ['Evidence'], type: 'EVIDENCE', displayName: 'EV-00124', properties: { evidenceId: 'EV-00124', type: 'CDR', date: '2026-08-12', confidence: 94, flagged: true }, caseIds: ['CASE-2026-014'], connectionCount: 2 },
  { id: 'ev-00501', labels: ['Evidence'], type: 'EVIDENCE', displayName: 'EV-00501', properties: { evidenceId: 'EV-00501', type: 'Financial', date: '2026-08-10', confidence: 92, flagged: true }, caseIds: ['CASE-2026-014'], connectionCount: 3 },
];

export const getGraphNodeById = (id: string): GraphNode | undefined =>
  graphNodes.find((n) => n.id === id);

export const getGraphNodesByCase = (caseId: string): GraphNode[] =>
  graphNodes.filter((n) => n.caseIds.includes(caseId));

export const getGraphNodesByType = (type: GraphNode['type']): GraphNode[] =>
  graphNodes.filter((n) => n.type === type);
