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

  // ── CASE-2026-011: Operation Dark Stream (Cybercrime) ──────
  { id: 'p011-001', labels: ['Person'], type: 'PERSON', displayName: 'Arjun Verma', properties: { name: 'Arjun Verma', alias: 'Phantom_Node', investigationPriority: 91, evidenceCount: 22, occupation: 'Software Developer', caseId: 'CASE-2026-011' }, caseIds: ['CASE-2026-011'], investigationPriority: 91, evidenceCount: 22, connectionCount: 14 },
  { id: 'p011-002', labels: ['Person'], type: 'PERSON', displayName: 'Deepa Krishnan', properties: { name: 'Deepa Krishnan', alias: 'DK', investigationPriority: 78, evidenceCount: 14, occupation: 'Network Administrator', caseId: 'CASE-2026-011' }, caseIds: ['CASE-2026-011'], investigationPriority: 78, evidenceCount: 14, connectionCount: 9 },
  { id: 'p011-003', labels: ['Person'], type: 'PERSON', displayName: 'Priya Menon', properties: { name: 'Priya Menon', alias: 'PM', investigationPriority: 65, evidenceCount: 9, occupation: 'IT Consultant', caseId: 'CASE-2026-011' }, caseIds: ['CASE-2026-011'], investigationPriority: 65, evidenceCount: 9, connectionCount: 6 },
  { id: 'p011-004', labels: ['Person'], type: 'PERSON', displayName: 'Rahul Iyer', properties: { name: 'Rahul Iyer', alias: 'R. Iyer', investigationPriority: 54, evidenceCount: 6, occupation: 'Freelance Developer', caseId: 'CASE-2026-011' }, caseIds: ['CASE-2026-011'], investigationPriority: 54, evidenceCount: 6, connectionCount: 4 },
  { id: 'org-011-001', labels: ['Organization'], type: 'ORGANIZATION', displayName: 'CipherTech Solutions', properties: { name: 'CipherTech Solutions Pvt Ltd', type: 'IT Company', investigationPriority: 82 }, caseIds: ['CASE-2026-011'], investigationPriority: 82, evidenceCount: 11, connectionCount: 6 },
  { id: 'org-011-002', labels: ['Organization'], type: 'ORGANIZATION', displayName: 'DarkNet Forum', properties: { name: 'DarkNet Forum (Online)', type: 'Online Platform', investigationPriority: 71 }, caseIds: ['CASE-2026-011'], investigationPriority: 71, evidenceCount: 8, connectionCount: 5 },
  { id: 'loc-011-001', labels: ['Location'], type: 'LOCATION', displayName: 'Koramangala Co-Working', properties: { name: '4th Block Co-Working Space', city: 'Bengaluru', type: 'Office', visitCount: 31 }, caseIds: ['CASE-2026-011'], connectionCount: 4 },
  { id: 'loc-011-002', labels: ['Location'], type: 'LOCATION', displayName: 'MindTree Tech Park', properties: { name: 'MindTree Tech Park', city: 'Bengaluru', type: 'Office', visitCount: 14 }, caseIds: ['CASE-2026-011'], connectionCount: 3 },
  { id: 'phone-011-001', labels: ['Phone'], type: 'PHONE', displayName: '+91-96341-00821', properties: { number: '+91-96341-00821', carrier: 'Jio', callCount: 112 }, caseIds: ['CASE-2026-011'], connectionCount: 3 },
  { id: 'phone-011-002', labels: ['Phone'], type: 'PHONE', displayName: '+91-89001-74412', properties: { number: '+91-89001-74412', carrier: 'BSNL', callCount: 54 }, caseIds: ['CASE-2026-011'], connectionCount: 2 },
  { id: 'ev-011-001', labels: ['Evidence'], type: 'EVIDENCE', displayName: 'EV-011-001', properties: { evidenceId: 'EV-011-001', type: 'CDR', date: '2026-06-12', confidence: 91, flagged: true }, caseIds: ['CASE-2026-011'], connectionCount: 3 },
  { id: 'ev-011-002', labels: ['Evidence'], type: 'EVIDENCE', displayName: 'EV-011-002', properties: { evidenceId: 'EV-011-002', type: 'Financial', date: '2026-06-15', confidence: 88, flagged: true }, caseIds: ['CASE-2026-011'], connectionCount: 2 },

  // ── CASE-2026-009: Port Smuggling Network ──────────────────
  { id: 'p009-001', labels: ['Person'], type: 'PERSON', displayName: 'Kavita Sharma', properties: { name: 'Kavita Sharma', alias: 'KS', investigationPriority: 88, evidenceCount: 19, occupation: 'Customs Agent', caseId: 'CASE-2026-009' }, caseIds: ['CASE-2026-009'], investigationPriority: 88, evidenceCount: 19, connectionCount: 12 },
  { id: 'p009-002', labels: ['Person'], type: 'PERSON', displayName: 'Suresh Babu', properties: { name: 'Suresh Babu', alias: 'SB', investigationPriority: 74, evidenceCount: 12, occupation: 'Port Worker', caseId: 'CASE-2026-009' }, caseIds: ['CASE-2026-009'], investigationPriority: 74, evidenceCount: 12, connectionCount: 8 },
  { id: 'p009-003', labels: ['Person'], type: 'PERSON', displayName: 'Rajan Pillai', properties: { name: 'Rajan Pillai', alias: 'R.P.', investigationPriority: 62, evidenceCount: 8, occupation: 'Logistics Operator', caseId: 'CASE-2026-009' }, caseIds: ['CASE-2026-009', 'CASE-2026-014'], investigationPriority: 62, evidenceCount: 8, connectionCount: 6 },
  { id: 'org-009-001', labels: ['Organization'], type: 'ORGANIZATION', displayName: 'Southern Cargo Ltd.', properties: { name: 'Southern Cargo Ltd.', type: 'Logistics Company', investigationPriority: 79 }, caseIds: ['CASE-2026-009'], investigationPriority: 79, evidenceCount: 10, connectionCount: 5 },
  { id: 'loc-009-001', labels: ['Location'], type: 'LOCATION', displayName: 'Chennai Port — CT3', properties: { name: 'Chennai Port Container Terminal 3', city: 'Chennai', type: 'Port', visitCount: 42 }, caseIds: ['CASE-2026-009'], connectionCount: 7 },
  { id: 'loc-009-002', labels: ['Location'], type: 'LOCATION', displayName: 'Ambattur Warehouse B', properties: { name: 'Ambattur Estate Warehouse B', city: 'Chennai', type: 'Warehouse', visitCount: 18 }, caseIds: ['CASE-2026-009'], connectionCount: 4 },
  { id: 'vehicle-009-001', labels: ['Vehicle'], type: 'VEHICLE', displayName: 'Toyota Qualis TN-05', properties: { make: 'Toyota', model: 'Qualis', color: 'White', registration: 'TN-05-ZZ-1122', sightingCount: 22 }, caseIds: ['CASE-2026-009'], connectionCount: 3 },
  { id: 'account-009-001', labels: ['BankAccount'], type: 'BANK_ACCOUNT', displayName: 'CC-00441-IOB', properties: { accountNumber: 'CC-00441-IOB', bank: 'Indian Overseas Bank', type: 'Current', flagged: true, transactions: 11 }, caseIds: ['CASE-2026-009'], connectionCount: 2 },
  { id: 'ev-009-001', labels: ['Evidence'], type: 'EVIDENCE', displayName: 'EV-009-001', properties: { evidenceId: 'EV-009-001', type: 'Surveillance', date: '2026-05-21', confidence: 86, flagged: true }, caseIds: ['CASE-2026-009'], connectionCount: 2 },
];

export const getGraphNodeById = (id: string): GraphNode | undefined =>
  graphNodes.find((n) => n.id === id);

export const getGraphNodesByCase = (caseId: string): GraphNode[] =>
  graphNodes.filter((n) => n.caseIds.includes(caseId));

export const getGraphNodesByType = (type: GraphNode['type']): GraphNode[] =>
  graphNodes.filter((n) => n.type === type);
