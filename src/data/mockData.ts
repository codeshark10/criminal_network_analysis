import type { Alert, CaseFile, Entity, Evidence, InvestigationCandidate, Person, Priority, Relationship, TimelineEvent } from '../types'

const personSeed: Array<[string, string, string, number]> = [
  ['Marcus Thorne', 'Enforcer', 'Network focal entity', 94], ['Sarah Lin', 'Accountant', 'Financial liaison', 92],
  ['Victor Hale', 'Broker', 'Logistics coordinator', 81], ['Carlos Mendez', 'Courier', 'Transport associate', 69],
  ['Elena Rostova', 'Vega', 'External contact', 61], ['Daniel Price', 'Dockmaster', 'Port access liaison', 74],
  ['Nadia Singh', 'N.S.', 'Records associate', 66], ['James Okoro', 'J.O.', 'Cash movement associate', 63],
  ['Ibrahim Khan', 'Falcon', 'Communications contact', 72], ['Priya Mehra', 'P.M.', 'Finance contact', 58],
  ['Andre Wallace', 'A.W.', 'Vehicle operator', 55], ['Mei Chen', 'M.C.', 'Commercial contact', 57],
  ['Omar Aziz', 'O.A.', 'Warehouse associate', 67], ['Lucia Romano', 'L.R.', 'Event attendee', 52],
  ['Gabriel Soto', 'G.S.', 'Network associate', 64], ['Helen Brooks', 'H.B.', 'Business liaison', 49],
  ['Tomas Ilic', 'T.I.', 'Freight contact', 60], ['Aisha Bello', 'A.B.', 'Analyst reference', 48],
  ['Rohan Das', 'R.D.', 'Data contact', 54], ['Natalie Fox', 'N.F.', 'Location associate', 51],
  ['Ethan Cole', 'E.C.', 'Phone holder', 46], ['Zara Khan', 'Z.K.', 'Account holder', 59],
  ['Luis Ortega', 'L.O.', 'Transport contact', 56], ['Maya Patel', 'M.P.', 'Communications contact', 62],
  ['Noah Kim', 'N.K.', 'Organization liaison', 50], ['Sofia Alvarez', 'S.A.', 'Transaction reference', 53],
  ['Arjun Rao', 'A.R.', 'Cross-case reference', 65], ['Rita Shah', 'R.S.', 'Cross-case contact', 57],
  ['Dmitri Volkov', 'D.V.', 'External vendor', 68], ['Keira Moss', 'K.M.', 'Surveillance reference', 45],
]

export const persons: Person[] = personSeed.map(([label, alias, role, priority], index) => ({
  id: `person-${String(index + 1).padStart(3, '0')}`,
  type: 'PERSON', label,
  properties: { alias, role, priority, status: priority >= 80 ? 'Requires Investigation' : 'Review Queue', locations: index < 6 ? ['Chicago', 'Gary', 'Detroit'].slice(0, (index % 3) + 1) : ['Chicago'], evidenceCount: 4 + ((index * 3) % 15) },
  caseIds: index < 20 ? ['case-2026-014'] : ['case-2026-011'],
}))

const orgNames = ['Apex Freight Solutions', 'Pacific Import Export Co.', 'Northline Logistics', 'Meridian Holdings', 'Cobalt Trade Group', 'Lakeside Storage', 'Ardent Consulting', 'Harbor Gate Services', 'Vertex Motors', 'Sunrise Exchange', 'Greyline Systems', 'Rivertown Leasing']
const locations = ['Chicago Warehouse District', 'Gary Freight Terminal', 'Detroit Riverside', 'Midway Cargo Annex', 'Calumet Harbor', 'Cicero Depot', 'Lake Street Garage', 'South Loop Office', 'Joliet Interchange', 'River North Hotel', 'Aurora Transfer Yard', 'Hammond Loading Bay', 'Oak Park Residence', 'Evanston Marina', 'Bridgeport Yard', 'Oak Lawn Storage', 'Bensenville Office', 'Elmhurst Lot', 'Merrillville Station', 'Naperville Bank']

export const entities: Entity[] = [
  ...persons,
  ...orgNames.map((label, index) => ({ id: `org-${String(index + 1).padStart(3, '0')}`, type: 'ORGANIZATION' as const, label, properties: { sector: index % 2 ? 'Commercial trade' : 'Logistics', priority: 52 + index }, caseIds: ['case-2026-014'] })),
  ...locations.map((label, index) => ({ id: `loc-${String(index + 1).padStart(3, '0')}`, type: 'LOCATION' as const, label, properties: { city: index % 3 === 1 ? 'Gary' : 'Chicago', category: index % 2 ? 'Commercial' : 'Observed location' }, caseIds: ['case-2026-014'] })),
  ...Array.from({ length: 22 }, (_, index) => ({ id: `phone-${String(index + 1).padStart(3, '0')}`, type: 'PHONE' as const, label: `+1-619-555-${String(1022 + index).padStart(4, '0')}`, properties: { carrier: 'Registered telecom', status: 'Observed' }, caseIds: ['case-2026-014'] })),
  ...Array.from({ length: 12 }, (_, index) => ({ id: `vehicle-${String(index + 1).padStart(3, '0')}`, type: 'VEHICLE' as const, label: ['Silver Audi Q7', 'Black Ford Transit', 'Blue Volvo VNL', 'White Mercedes Sprinter'][index % 4] + ` · ${index + 11}K`, properties: { registration: `IL-${4200 + index}`, status: 'Observed' }, caseIds: ['case-2026-014'] })),
  ...Array.from({ length: 16 }, (_, index) => ({ id: `account-${String(index + 1).padStart(3, '0')}`, type: 'ACCOUNT' as const, label: `Account •••• ${String(1208 + index * 31).slice(-4)}`, properties: { institution: index % 2 ? 'Meridian Bank' : 'First Federal', status: 'Monitored' }, caseIds: ['case-2026-014'] })),
  ...Array.from({ length: 42 }, (_, index) => ({ id: `txn-${String(index + 1).padStart(3, '0')}`, type: 'TRANSACTION' as const, label: `$${(16000 + index * 9317).toLocaleString()}`, properties: { date: `2026-08-${String((index % 22) + 1).padStart(2, '0')}`, status: 'Flagged' }, caseIds: ['case-2026-014'] })),
  ...Array.from({ length: 52 }, (_, index) => ({ id: `event-${String(index + 1).padStart(3, '0')}`, type: 'EVENT' as const, label: `Observed activity ${String(index + 1).padStart(2, '0')}`, properties: { category: index % 2 ? 'Communication' : 'Surveillance' }, caseIds: ['case-2026-014'] })),
]

const coreLinks: Array<[string, string, Relationship['type']]> = [
  ['person-001', 'person-002', 'COMMUNICATED_WITH'], ['person-001', 'person-003', 'ASSOCIATED_WITH'], ['person-001', 'org-001', 'ASSOCIATED_WITH'], ['person-001', 'phone-001', 'USED'], ['person-001', 'vehicle-001', 'USED'], ['person-001', 'loc-001', 'OBSERVED_AT'], ['person-001', 'txn-001', 'MENTIONED_IN'],
  ['person-002', 'person-003', 'COMMUNICATED_WITH'], ['person-002', 'org-002', 'ASSOCIATED_WITH'], ['person-002', 'phone-002', 'USED'], ['person-002', 'account-001', 'OWNED_BY'], ['person-002', 'txn-001', 'MENTIONED_IN'], ['person-003', 'person-005', 'COMMUNICATED_WITH'], ['person-003', 'org-003', 'ASSOCIATED_WITH'], ['person-003', 'loc-002', 'OBSERVED_AT'], ['person-004', 'person-001', 'ASSOCIATED_WITH'], ['person-004', 'vehicle-002', 'USED'], ['person-005', 'org-004', 'ASSOCIATED_WITH'], ['person-005', 'loc-003', 'OBSERVED_AT'],
  ['account-001', 'account-002', 'TRANSFERRED_TO'], ['txn-001', 'account-002', 'TRANSFERRED_TO'], ['person-006', 'org-001', 'ASSOCIATED_WITH'], ['person-007', 'person-002', 'COMMUNICATED_WITH'], ['person-008', 'loc-001', 'OBSERVED_AT'], ['person-009', 'phone-001', 'USED'], ['person-010', 'account-002', 'OWNED_BY'],
]

export const relationships: Relationship[] = [
  ...coreLinks.map(([source, target, type], index) => ({ id: `rel-core-${index + 1}`, source, target, type, properties: { evidenceCount: 2 + (index % 7), confidence: 0.81 + (index % 18) / 100, lastObserved: `2026-08-${String(22 - (index % 18)).padStart(2, '0')}` } })),
  ...Array.from({ length: 115 }, (_, index) => {
    const from = entities[index % 64]
    const to = entities[(index * 7 + 9) % 128]
    const kinds: Relationship['type'][] = ['COMMUNICATED_WITH', 'ASSOCIATED_WITH', 'LOCATED_AT', 'USED', 'TRANSFERRED_TO', 'OBSERVED_AT', 'OWNED_BY', 'MENTIONED_IN']
    return { id: `rel-${index + 1}`, source: from.id, target: to.id, type: kinds[index % kinds.length], properties: { evidenceCount: 1 + (index % 8), confidence: 0.7 + (index % 27) / 100, lastObserved: `2026-08-${String((index % 24) + 1).padStart(2, '0')}` } }
  }),
]

export const cases: CaseFile[] = [
  { id: 'case-2026-014', name: 'Organized Financial Network', type: 'Financial intelligence', status: 'ACTIVE', priority: 'HIGH', persons: 34, evidence: 342, relationships: 1492, entities: 687, locations: 48, financialEvents: 76, lastActivity: '14 min ago' },
  { id: 'case-2026-011', name: 'Interstate Communication Network', type: 'Communications intelligence', status: 'ACTIVE', priority: 'MEDIUM', persons: 27, evidence: 188, relationships: 764, entities: 412, locations: 31, financialEvents: 18, lastActivity: '2 hr ago' },
  { id: 'case-2026-008', name: 'Synthetic Intelligence Investigation', type: 'Multi-source intelligence', status: 'UNDER REVIEW', priority: 'HIGH', persons: 19, evidence: 109, relationships: 486, entities: 248, locations: 17, financialEvents: 22, lastActivity: '1 d ago' },
  { id: 'case-2026-003', name: 'Harbor Logistics Review', type: 'Transport intelligence', status: 'ACTIVE', priority: 'LOW', persons: 12, evidence: 64, relationships: 203, entities: 126, locations: 14, financialEvents: 9, lastActivity: '3 d ago' },
]

const evidenceTypes: Evidence['type'][] = ['CDR', 'FINANCIAL', 'SURVEILLANCE', 'WIRETAP', 'INTELLIGENCE REPORT', 'FIR', 'SOCIAL', 'CRIMINAL HISTORY']
export const evidence: Evidence[] = Array.from({ length: 60 }, (_, index) => ({
  id: `EV-${String(124 + index).padStart(5, '0')}`,
  type: evidenceTypes[index % evidenceTypes.length],
  date: `2026-08-${String((index % 24) + 1).padStart(2, '0')}`,
  entities: index % 3 === 0 ? ['Marcus Thorne', 'Sarah Lin'] : [persons[index % persons.length].label, persons[(index + 1) % persons.length].label],
  location: locations[index % locations.length], status: index % 7 === 0 ? 'Under review' : index % 5 === 0 ? 'Verified' : 'Processed', confidence: 72 + (index % 25), source: ['NCRB records', 'CDR ingest', 'Financial intelligence', 'Field surveillance'][index % 4], caseId: index < 50 ? 'case-2026-014' : 'case-2026-011', summary: index % 2 ? 'Communication and co-location pattern observed across related entities.' : 'Structured record indicates a relationship requiring investigator review.',
}))

const candidatesData: Array<[string, number, Priority, string]> = [
  ['person-002', 92, 'HIGH', 'Direct financial + communication connection'], ['person-003', 81, 'HIGH', 'Second-degree logistics and organization link'], ['person-006', 74, 'HIGH', 'Organization association with cross-source support'], ['person-004', 69, 'MEDIUM', 'Shared vehicle and observed location'], ['person-005', 61, 'MEDIUM', 'Indirect communications bridge'], ['person-009', 58, 'MEDIUM', 'Shared phone and event references'], ['person-007', 55, 'LOW', 'Repeated proximity in evidence'],
]
export const candidates: InvestigationCandidate[] = candidatesData.map(([personId, score, priority, relationship], index) => ({ personId, score, priority, relationship, evidenceSources: ['CDR', 'Financial', 'Surveillance', 'Wiretap'].slice(0, 2 + (index % 3)), evidenceCount: 7 + index * 2, connections: 5 + index * 3, lastActivity: `${index + 1}h ago`, indicators: ['Direct communication with known entity', 'Cross-source evidence convergence', 'Shared location association', 'Network bridge behavior'].slice(0, 2 + (index % 3)), rationale: [{ label: 'Network Centrality', value: 18 + (index % 5) }, { label: 'Cross-source Evidence', value: 22 - index }, { label: 'Financial Indicators', value: 19 - (index % 4) }, { label: 'Communication Patterns', value: 17 }, { label: 'Location Correlation', value: 12 }, { label: 'Behavioral Anomalies', value: 12 + (index % 3) }] }))

export const alerts: Alert[] = [
  { id: 'alert-1', priority: 'HIGH', title: 'Unusual communication spike', subject: 'Marcus Thorne', description: '37 calls recorded within a two-hour window across three registered devices.', timestamp: '12 min ago', relatedId: 'person-001' },
  { id: 'alert-2', priority: 'HIGH', title: 'Cross-network financial transfer', subject: 'Account •••• 1208', description: '$397,000 transfer links two previously separated network communities.', timestamp: '1 hr ago', relatedId: 'txn-001' },
  { id: 'alert-3', priority: 'MEDIUM', title: 'Repeated location overlap', subject: 'Gary Freight Terminal', description: 'Three persons of interest were repeatedly observed at the same location.', timestamp: '4 hr ago', relatedId: 'loc-002' },
  { id: 'alert-4', priority: 'LOW', title: 'New entity relationship detected', subject: 'Apex Freight Solutions', description: 'A previously unknown association was inferred from supporting records.', timestamp: 'Yesterday', relatedId: 'org-001' },
]

export const timeline: TimelineEvent[] = [
  { id: 'time-1', time: '09:12', date: '25 Aug 2026', title: 'Phone call between Marcus and Sarah', description: 'A 14-minute call was processed from linked device records.', type: 'Communication', entityIds: ['person-001', 'person-002'], location: 'Chicago Warehouse District' },
  { id: 'time-2', time: '10:45', date: '25 Aug 2026', title: 'Vehicle detected near warehouse', description: 'Silver Audi Q7 matched a prior observed vehicle reference.', type: 'Surveillance', entityIds: ['person-001', 'vehicle-001'], location: 'Gary Freight Terminal' },
  { id: 'time-3', time: '12:20', date: '25 Aug 2026', title: 'Financial transaction initiated', description: 'A flagged transfer entered the monitored transaction chain.', type: 'Financial', entityIds: ['person-002', 'txn-001'], location: 'Meridian Bank' },
  { id: 'time-4', time: '14:03', date: '24 Aug 2026', title: 'Marcus observed at location', description: 'Source material records an observed appearance.', type: 'Location', entityIds: ['person-001', 'loc-001'], location: 'Chicago Warehouse District' },
  { id: 'time-5', time: '16:31', date: '24 Aug 2026', title: 'Communication with organization contact', description: 'Communication metadata associated with Apex Freight reference.', type: 'Association', entityIds: ['person-003', 'org-001'], location: 'South Loop Office' },
  { id: 'time-6', time: '18:45', date: '23 Aug 2026', title: 'Large financial transfer detected', description: 'The amount exceeded the configured review threshold.', type: 'Financial', entityIds: ['person-002', 'account-001'], location: 'Naperville Bank' },
]
