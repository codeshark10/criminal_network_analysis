// ============================================================
// NEXUS — Extracted Chunks Dataset
// SYNTHETIC DEMONSTRATION DATA | SIH26189
// These represent AI-extracted chunks from uploaded documents
// ============================================================

import type { ExtractedChunk } from '../types';

// ── CASE-2026-014 Chunks (sample — 30 of 243 shown) ──────────
const case014Chunks: ExtractedChunk[] = [
  {
    id: 'chunk-014-001',
    caseId: 'CASE-2026-014',
    documentId: 'doc-014-001',
    index: 1,
    text: 'First Information Report No. 124/2026, registered at Dharavi Police Station, Mumbai, against unknown persons for offences under Sections 120-B, 420, 467, 468, 471 IPC. Complainant: Sub-Inspector Mahesh Patil. Incident reported on 14 July 2026.',
    category: 'FIR',
    confidence: 97,
    entities: ['Dharavi Police Station', 'Mahesh Patil', 'Mumbai'],
    relationships: [
      { from: 'FIR-124/2026', type: 'REGISTERED_AT', to: 'Dharavi Police Station' },
    ],
    createdAt: '2026-07-01T09:18:00',
  },
  {
    id: 'chunk-014-002',
    caseId: 'CASE-2026-014',
    documentId: 'doc-014-001',
    index: 2,
    text: 'On 14 August 2026, the subject Marcus Thorne contacted Sarah Lin via phone number +91-97712-55012 at 14:23 IST. Call duration: 4 minutes 12 seconds. Cell tower location: Dharavi, Mumbai. CDR analysis indicates this is the 17th contact event between these two subjects in a 30-day period.',
    category: 'CDR',
    confidence: 94,
    entities: ['Marcus Thorne', 'Sarah Lin', '+91-97712-55012', 'Dharavi'],
    relationships: [
      { from: 'Marcus Thorne', type: 'COMMUNICATED_WITH', to: 'Sarah Lin' },
      { from: 'Marcus Thorne', type: 'USES', to: '+91-97712-55012' },
    ],
    createdAt: '2026-07-01T09:18:02',
  },
  {
    id: 'chunk-014-003',
    caseId: 'CASE-2026-014',
    documentId: 'doc-014-001',
    index: 3,
    text: 'Transaction of ₹32,70,000 was transferred from Account No. ACC-00712-HDFC (holder: Marcus Thorne) to Account No. ACC-01124-SBI (holder: Sarah Lin) on 10 August 2026. Transaction ID: TX-00124. Transaction type: NEFT. Flagged by automated monitoring system for unusual pattern.',
    category: 'FINANCIAL',
    confidence: 96,
    entities: ['Marcus Thorne', 'Sarah Lin', 'ACC-00712-HDFC', 'ACC-01124-SBI', 'TX-00124'],
    relationships: [
      { from: 'Marcus Thorne', type: 'TRANSFERRED_TO', to: 'Sarah Lin' },
      { from: 'TX-00124', type: 'FROM', to: 'ACC-00712-HDFC' },
      { from: 'TX-00124', type: 'TO', to: 'ACC-01124-SBI' },
    ],
    createdAt: '2026-07-01T09:18:04',
  },
  {
    id: 'chunk-014-004',
    caseId: 'CASE-2026-014',
    documentId: 'doc-014-001',
    index: 4,
    text: 'Subject Marcus Thorne was observed at Dharavi Warehouse Complex on 25 August 2026 at 10:15 AM. Arrived in Silver Audi Q7 (MH-01-AX-7821). Met with an unidentified male for approximately 45 minutes. Departed at 11:02 AM. Surveillance Unit 7 report.',
    category: 'SURVEILLANCE',
    confidence: 91,
    entities: ['Marcus Thorne', 'Dharavi Warehouse Complex', 'MH-01-AX-7821'],
    relationships: [
      { from: 'Marcus Thorne', type: 'OBSERVED_AT', to: 'Dharavi Warehouse Complex' },
      { from: 'Marcus Thorne', type: 'USES', to: 'Silver Audi Q7 (MH-01-AX-7821)' },
    ],
    createdAt: '2026-07-01T09:18:06',
  },
  {
    id: 'chunk-014-005',
    caseId: 'CASE-2026-014',
    documentId: 'doc-014-001',
    index: 5,
    text: 'Previous criminal history indicates Marcus Thorne has prior involvements: (1) Case 2019/FIN/082 — Cheque dishonour, acquitted 2021; (2) Case 2022/ORG/011 — Conspiracy charges, pending. Criminal history records from NCRB database accessed on 01 July 2026.',
    category: 'CRIMINAL_HISTORY',
    confidence: 88,
    entities: ['Marcus Thorne', 'Case 2019/FIN/082', 'Case 2022/ORG/011', 'NCRB'],
    relationships: [
      { from: 'Marcus Thorne', type: 'HAS_RECORD', to: 'Case 2019/FIN/082' },
      { from: 'Marcus Thorne', type: 'HAS_RECORD', to: 'Case 2022/ORG/011' },
    ],
    createdAt: '2026-07-01T09:18:08',
  },
  {
    id: 'chunk-014-006',
    caseId: 'CASE-2026-014',
    documentId: 'doc-014-001',
    index: 6,
    text: 'Intelligence report from field asset: Subject Victor Hale operates import-export management under Pacific Trading Co., registered at Plot 14, Ambattur Industrial Estate, Chennai. Hale is suspected to be coordinating logistics for Apex Freight International.',
    category: 'INTELLIGENCE',
    confidence: 83,
    entities: ['Victor Hale', 'Pacific Trading Co.', 'Ambattur Industrial Estate', 'Chennai', 'Apex Freight International'],
    relationships: [
      { from: 'Victor Hale', type: 'WORKS_FOR', to: 'Pacific Trading Co.' },
      { from: 'Pacific Trading Co.', type: 'CONNECTED_TO', to: 'Apex Freight International' },
    ],
    createdAt: '2026-07-01T09:18:10',
  },
  {
    id: 'chunk-014-007',
    caseId: 'CASE-2026-014',
    documentId: 'doc-014-001',
    index: 7,
    text: 'Social intelligence from open-source analysis: Apex Freight International has 847 social media mentions in the past 6 months. Sentiment analysis indicates 34% of mentions are linked to logistics delays at port facilities. Subject Sarah Lin maintains a professional profile listing employment at Apex Freight.',
    category: 'SOCIAL_INTELLIGENCE',
    confidence: 76,
    entities: ['Apex Freight International', 'Sarah Lin'],
    relationships: [
      { from: 'Sarah Lin', type: 'WORKS_FOR', to: 'Apex Freight International' },
    ],
    createdAt: '2026-07-01T09:18:12',
  },
  {
    id: 'chunk-014-008',
    caseId: 'CASE-2026-014',
    documentId: 'doc-014-001',
    index: 8,
    text: 'CDR analysis shows 23 calls between +91-88001-34451 (Sarah Lin) and +91-97733-71110 (Victor Hale) between July 1 and August 20, 2026. Peak call frequency observed during August 10-15, coinciding with flagged financial transaction TX-00124.',
    category: 'CDR',
    confidence: 92,
    entities: ['Sarah Lin', 'Victor Hale', '+91-88001-34451', '+91-97733-71110', 'TX-00124'],
    relationships: [
      { from: 'Sarah Lin', type: 'COMMUNICATED_WITH', to: 'Victor Hale' },
    ],
    createdAt: '2026-07-01T09:18:14',
  },
  {
    id: 'chunk-014-009',
    caseId: 'CASE-2026-014',
    documentId: 'doc-014-001',
    index: 9,
    text: 'FIR Reference No. 2026/MH/PORT/0042 — Complaint filed regarding unauthorized access to JNPT cargo manifest system. Suspected involvement of port staff. Investigation linked to Rohan Bose, employed as Port Inspector at Jawaharlal Nehru Port. Filed: 18 August 2026.',
    category: 'FIR',
    confidence: 94,
    entities: ['Rohan Bose', 'Jawaharlal Nehru Port', 'JNPT', '2026/MH/PORT/0042'],
    relationships: [
      { from: 'Rohan Bose', type: 'WORKS_AT', to: 'Jawaharlal Nehru Port' },
    ],
    createdAt: '2026-07-01T09:18:16',
  },
  {
    id: 'chunk-014-010',
    caseId: 'CASE-2026-014',
    documentId: 'doc-014-001',
    index: 10,
    text: 'Financial intelligence report: Cross-network transfer of ₹3,97,00,000 (₹3.97 crore) on 18 August 2026. Transaction TX-00281 routed from Apex Holdings Pvt. Ltd. through intermediary accounts to entities in offshore jurisdictions. Flagged by FIUCB monitoring. Carlos Mendez identified as account manager.',
    category: 'FINANCIAL',
    confidence: 95,
    entities: ['Apex Holdings Pvt. Ltd.', 'Carlos Mendez', 'TX-00281'],
    relationships: [
      { from: 'Carlos Mendez', type: 'MANAGES', to: 'Apex Holdings Pvt. Ltd.' },
      { from: 'Apex Holdings Pvt. Ltd.', type: 'INVOLVED_IN', to: 'TX-00281' },
    ],
    createdAt: '2026-07-01T09:18:18',
  },
  {
    id: 'chunk-014-011',
    caseId: 'CASE-2026-014',
    documentId: 'doc-014-002',
    index: 11,
    text: 'Surveillance report — Unit 4 observation log, 22 August 2026. Black Toyota Innova (TN-09-GH-4401) was observed near JN Port Gate 3 at 08:42 AM. Vehicle occupied by two individuals. Registration linked to subject Victor Hale. Duration of parking: 1 hour 18 minutes.',
    category: 'SURVEILLANCE',
    confidence: 89,
    entities: ['Victor Hale', 'Toyota Innova', 'TN-09-GH-4401', 'JN Port'],
    relationships: [
      { from: 'Victor Hale', type: 'USES', to: 'Toyota Innova (TN-09-GH-4401)' },
      { from: 'Victor Hale', type: 'OBSERVED_AT', to: 'JN Port' },
    ],
    createdAt: '2026-07-08T11:33:00',
  },
  {
    id: 'chunk-014-012',
    caseId: 'CASE-2026-014',
    documentId: 'doc-014-002',
    index: 12,
    text: 'Meeting observed between Omar Shaikh and Victor Hale at Ambattur Industrial Estate, Chennai on 18 August 2026. Both individuals entered a storage unit registered under Pacific Trading Co. Meeting lasted 2 hours. Harish Nair (transport manager) was present during the latter half of the meeting.',
    category: 'SURVEILLANCE',
    confidence: 87,
    entities: ['Omar Shaikh', 'Victor Hale', 'Harish Nair', 'Ambattur Industrial Estate', 'Pacific Trading Co.'],
    relationships: [
      { from: 'Omar Shaikh', type: 'MEETING_WITH', to: 'Victor Hale' },
      { from: 'Harish Nair', type: 'MEETING_WITH', to: 'Omar Shaikh' },
    ],
    createdAt: '2026-07-08T11:33:04',
  },
];

// ── CASE-2026-011 Chunks (sample — 10 of 158 shown) ──────────
const case011Chunks: ExtractedChunk[] = [
  {
    id: 'chunk-011-001',
    caseId: 'CASE-2026-011',
    documentId: 'doc-011-001',
    index: 1,
    text: 'FIR No. 2026/KA/CYBER/0091 registered at Cubbon Park Cyber Crime Station, Bengaluru. Complaint filed by National Bank of India regarding ransomware attack on core banking systems on 10 June 2026. Estimated financial impact: ₹14.2 crore. FIR references suspect alias "Phantom_Node".',
    category: 'FIR',
    confidence: 96,
    entities: ['National Bank of India', 'Cubbon Park Cyber Crime Station', 'Bengaluru', 'Phantom_Node'],
    relationships: [
      { from: 'FIR-2026/KA/CYBER/0091', type: 'REGISTERED_AT', to: 'Cubbon Park Cyber Crime Station' },
    ],
    createdAt: '2026-06-15T10:48:00',
  },
  {
    id: 'chunk-011-002',
    caseId: 'CASE-2026-011',
    documentId: 'doc-011-001',
    index: 2,
    text: 'CDR analysis for +91-96341-00821 (subject: Arjun Verma) shows 41 calls to numbers associated with known cybercrime network in a 15-day window. 8 calls to international prefix +372 (Estonia). Call spike observed 3 days before ransomware attack. Cell tower: Koramangala, Bengaluru.',
    category: 'CDR',
    confidence: 91,
    entities: ['Arjun Verma', '+91-96341-00821', 'Koramangala', 'Bengaluru'],
    relationships: [
      { from: 'Arjun Verma', type: 'USES', to: '+91-96341-00821' },
      { from: 'Arjun Verma', type: 'LOCATED_AT', to: 'Koramangala' },
    ],
    createdAt: '2026-06-15T10:48:02',
  },
  {
    id: 'chunk-011-003',
    caseId: 'CASE-2026-011',
    documentId: 'doc-011-001',
    index: 3,
    text: 'Financial analysis: Bitcoin wallet 1A2B3C4D5E6F (linked to alias Phantom_Node) received 2.8 BTC (approx. ₹1.82 crore) from ransomware victim wallets between June 10-15, 2026. Wallet flagged by FIU-IND. Transaction trace shows mixing service usage to obfuscate trail.',
    category: 'FINANCIAL',
    confidence: 88,
    entities: ['Phantom_Node', 'Bitcoin', 'FIU-IND'],
    relationships: [
      { from: 'Phantom_Node', type: 'CONTROLS', to: 'Bitcoin Wallet 1A2B3C4D5E6F' },
    ],
    createdAt: '2026-06-15T10:48:04',
  },
  {
    id: 'chunk-011-004',
    caseId: 'CASE-2026-011',
    documentId: 'doc-011-001',
    index: 4,
    text: 'Intelligence report: Field asset confirms Arjun Verma operates from a co-working space at 4th Block, Koramangala, Bengaluru. Subject uses encrypted communication channels. Suspected to be the primary technical operator for the ransomware deployment. Associates with individuals at MindTree tech park.',
    category: 'INTELLIGENCE',
    confidence: 82,
    entities: ['Arjun Verma', 'Koramangala', 'Bengaluru', 'MindTree'],
    relationships: [
      { from: 'Arjun Verma', type: 'WORKS_AT', to: 'Co-working Space, Koramangala' },
    ],
    createdAt: '2026-06-15T10:48:06',
  },
  {
    id: 'chunk-011-005',
    caseId: 'CASE-2026-011',
    documentId: 'doc-011-001',
    index: 5,
    text: 'Criminal history: Arjun Verma, age 29, has prior case 2024/KA/CYBER/014 — data theft charges, case pending. Deepa Krishnan, age 34, has no prior criminal record. Priya Menon, age 27, cautioned in 2023 for unauthorized computer access, no conviction.',
    category: 'CRIMINAL_HISTORY',
    confidence: 90,
    entities: ['Arjun Verma', 'Deepa Krishnan', 'Priya Menon'],
    relationships: [
      { from: 'Arjun Verma', type: 'HAS_RECORD', to: 'Case 2024/KA/CYBER/014' },
    ],
    createdAt: '2026-06-15T10:48:08',
  },
];

// ── CASE-2026-009 Chunks (sample — 10 of 107 shown) ──────────
const case009Chunks: ExtractedChunk[] = [
  {
    id: 'chunk-009-001',
    caseId: 'CASE-2026-009',
    documentId: 'doc-009-001',
    index: 1,
    text: 'FIR No. 2026/TN/PORT/0018 filed at Chennai Port Police Station regarding smuggling of undeclared goods through Container Terminal 3. Tipoff received from customs intelligence dated 18 May 2026. Suspect vessel: MV Celestine Star (registered: Singapore).',
    category: 'FIR',
    confidence: 95,
    entities: ['Chennai Port Police Station', 'MV Celestine Star', 'Container Terminal 3'],
    relationships: [
      { from: 'FIR-2026/TN/PORT/0018', type: 'REGISTERED_AT', to: 'Chennai Port Police Station' },
    ],
    createdAt: '2026-05-20T08:33:00',
  },
  {
    id: 'chunk-009-002',
    caseId: 'CASE-2026-009',
    documentId: 'doc-009-001',
    index: 2,
    text: 'Surveillance log: Subject Kavita Sharma observed conducting cash transactions near Ambattur Estate warehouses on 3 consecutive occasions (May 21, 24, 28, 2026). Each transaction involved exchange of packets with a Toyota Qualis occupant. Vehicle registration: TN-05-ZZ-1122.',
    category: 'SURVEILLANCE',
    confidence: 86,
    entities: ['Kavita Sharma', 'Ambattur Estate', 'Toyota Qualis', 'TN-05-ZZ-1122'],
    relationships: [
      { from: 'Kavita Sharma', type: 'OBSERVED_AT', to: 'Ambattur Estate' },
    ],
    createdAt: '2026-05-20T08:33:02',
  },
  {
    id: 'chunk-009-003',
    caseId: 'CASE-2026-009',
    documentId: 'doc-009-001',
    index: 3,
    text: 'Financial analysis: Account CC-00441-IOB (holder: Kavita Sharma) shows 11 cash deposits totaling ₹18.4 lakh over 45 days with no corresponding business income. Account flagged for structuring activity. Three deposits immediately below ₹2 lakh threshold.',
    category: 'FINANCIAL',
    confidence: 93,
    entities: ['Kavita Sharma', 'CC-00441-IOB', 'Indian Overseas Bank'],
    relationships: [
      { from: 'Kavita Sharma', type: 'OWNS', to: 'CC-00441-IOB' },
    ],
    createdAt: '2026-05-20T08:33:04',
  },
];

export const caseChunks: ExtractedChunk[] = [
  ...case014Chunks,
  ...case011Chunks,
  ...case009Chunks,
];

export const getChunksByCase = (caseId: string): ExtractedChunk[] =>
  caseChunks.filter((c) => c.caseId === caseId);

export const getChunksByDocument = (documentId: string): ExtractedChunk[] =>
  caseChunks.filter((c) => c.documentId === documentId);

export const getChunksByCategory = (caseId: string, category: string): ExtractedChunk[] =>
  caseChunks.filter((c) => c.caseId === caseId && c.category === category);

export const getChunkById = (id: string): ExtractedChunk | undefined =>
  caseChunks.find((c) => c.id === id);
