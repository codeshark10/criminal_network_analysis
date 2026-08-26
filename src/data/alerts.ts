// ============================================================
// NEXUS — Alerts, Events, Analytics Data
// SYNTHETIC DEMONSTRATION DATA | SIH26189
// ============================================================

import type { Alert, InvestigationEvent, DataSource, ChartDataPoint } from '../types';

// ── Alerts ────────────────────────────────────────────────────
export const alerts: Alert[] = [
  { id: 'alert-001', title: 'Unusual Communication Spike Detected', description: 'Marcus Thorne (+91-97712-55012) recorded 37 calls within a 2-hour window on 23 Aug 2026. Pattern is statistically anomalous compared to baseline activity.', severity: 'HIGH', status: 'ACTIVE', caseId: 'CASE-2026-014', personIds: ['person-001'], evidenceIds: ['EV-00401'], detectedAt: '2026-08-23T10:15:00', category: 'Communication Anomaly' },
  { id: 'alert-002', title: 'Cross-Network Financial Transfer', description: 'Transaction TX-00281 of ₹3.97 crore connects two previously isolated financial clusters within CASE-2026-014. Suggests coordination between cluster nodes.', severity: 'HIGH', status: 'ACTIVE', caseId: 'CASE-2026-014', personIds: ['person-001', 'person-004'], evidenceIds: ['EV-00612'], detectedAt: '2026-08-18T17:00:00', category: 'Financial Anomaly' },
  { id: 'alert-003', title: 'Repeated Location Overlap — Three Persons of Interest', description: 'Marcus Thorne, Sarah Lin, and David Park have been repeatedly observed at the same location (Dharavi Warehouse) on multiple occasions. Pattern analysis indicates deliberate coordination.', severity: 'HIGH', status: 'ACTIVE', caseId: 'CASE-2026-014', personIds: ['person-001', 'person-002', 'person-006'], evidenceIds: ['EV-00961'], detectedAt: '2026-08-22T20:00:00', category: 'Location Anomaly' },
  { id: 'alert-004', title: 'New Cross-Case Entity Relationship Detected', description: 'Omar Shaikh (CASE-2026-009) has been identified as having financial connections to entities in CASE-2026-014. Cross-case network bridge detected.', severity: 'HIGH', status: 'ACTIVE', caseId: 'CASE-2026-014', personIds: ['person-013'], evidenceIds: ['EV-01041'], detectedAt: '2026-08-22T14:00:00', category: 'Network Anomaly' },
  { id: 'alert-005', title: 'Night-Time Communication Pattern', description: 'Multiple late-night (22:00–02:00) communications between key persons of interest identified. Possible operational coordination outside business hours.', severity: 'MEDIUM', status: 'ACTIVE', caseId: 'CASE-2026-014', personIds: ['person-001', 'person-003'], evidenceIds: ['EV-01141'], detectedAt: '2026-08-21T02:30:00', category: 'Communication Anomaly' },
  { id: 'alert-006', title: 'Flagged Financial Account Activity', description: 'Account ACC-00712-HDFC (Marcus Thorne) shows unusual transaction velocity — 12 transactions in 48 hours, significantly above baseline.', severity: 'MEDIUM', status: 'ACTIVE', caseId: 'CASE-2026-014', personIds: ['person-001'], evidenceIds: ['EV-00501'], detectedAt: '2026-08-20T09:00:00', category: 'Financial Anomaly' },
  { id: 'alert-007', title: 'Person of Interest Observed at Port Facility', description: 'Marcus Thorne and Harish Nair observed simultaneously at JN Port Complex. Proximity to logistics operations of concern.', severity: 'MEDIUM', status: 'ACTIVE', caseId: 'CASE-2026-014', personIds: ['person-001', 'person-015'], evidenceIds: ['EV-00841'], detectedAt: '2026-08-15T11:00:00', category: 'Location Anomaly' },
  { id: 'alert-008', title: 'New Entity Relationship Detected', description: 'Rohan Bose (port inspector) identified as connected to Apex Freight operations. Possible insider involvement requires investigator review.', severity: 'MEDIUM', status: 'ACKNOWLEDGED', caseId: 'CASE-2026-014', personIds: ['person-020'], evidenceIds: ['EV-00841'], detectedAt: '2026-08-19T10:00:00', acknowledgedAt: '2026-08-20T09:00:00', category: 'Network Anomaly' },
  { id: 'alert-009', title: 'Cybercrime Case — Activity at 02:14 AM', description: 'Nikhil Rawat (CASE-2026-011) active on network infrastructure at 02:14 AM. Pattern consistent with unauthorized system access.', severity: 'HIGH', status: 'ACTIVE', caseId: 'CASE-2026-011', personIds: ['person-011'], evidenceIds: [], detectedAt: '2026-08-25T02:20:00', category: 'Behavioral Anomaly' },
  { id: 'alert-010', title: 'Periodic Location Correlation', description: 'Victor Hale and Omar Shaikh observed at Ambattur Industrial Estate on three separate occasions within 30 days.', severity: 'LOW', status: 'ACTIVE', caseId: 'CASE-2026-014', personIds: ['person-003', 'person-013'], evidenceIds: ['EV-00901'], detectedAt: '2026-08-18T13:00:00', category: 'Location Anomaly' },
  { id: 'alert-011', title: 'Social Intelligence Match', description: 'Social media analysis reveals undisclosed organizational connection between Marcus Thorne and Apex Holdings not reflected in official records.', severity: 'LOW', status: 'RESOLVED', caseId: 'CASE-2026-014', personIds: ['person-001'], evidenceIds: ['EV-01201'], detectedAt: '2026-08-10T09:00:00', acknowledgedAt: '2026-08-11T10:00:00', category: 'Network Anomaly' },
  { id: 'alert-012', title: 'Financial Record Discrepancy', description: 'Carlos Mendez income records inconsistent with account activity. Discrepancy of estimated ₹18 lakh requires review.', severity: 'MEDIUM', status: 'ACTIVE', caseId: 'CASE-2026-014', personIds: ['person-004'], evidenceIds: ['EV-00701'], detectedAt: '2026-08-21T15:00:00', category: 'Financial Anomaly' },
];

// ── Investigation Events / Timeline ───────────────────────────
export const investigationEvents: InvestigationEvent[] = [
  { id: 'event-001', type: 'Communication', timestamp: '2026-08-12T09:12:44', date: '2026-08-12', time: '09:12', description: 'Phone call between Marcus Thorne and Sarah Lin (18 min, Airtel CDR)', caseIds: ['CASE-2026-014'], personIds: ['person-001', 'person-002'], evidenceIds: ['EV-00124'], importance: 'HIGH' },
  { id: 'event-002', type: 'Surveillance', timestamp: '2026-08-12T14:03:00', date: '2026-08-12', time: '14:03', description: 'Marcus Thorne and David Park observed at Dharavi Warehouse Complex', caseIds: ['CASE-2026-014'], personIds: ['person-001', 'person-006'], locationId: 'loc-001', evidenceIds: ['EV-00801'], importance: 'MEDIUM' },
  { id: 'event-003', type: 'Financial', timestamp: '2026-08-10T15:30:00', date: '2026-08-10', time: '15:30', description: 'Financial transfer TX-00124 of ₹32.7 lakh initiated via Apex Freight entity', caseIds: ['CASE-2026-014'], personIds: ['person-001', 'person-002'], evidenceIds: ['EV-00501'], importance: 'HIGH' },
  { id: 'event-004', type: 'Communication', timestamp: '2026-08-14T14:33:11', date: '2026-08-14', time: '14:33', description: 'Second call between Marcus Thorne and Sarah Lin — pattern analysis flags regular schedule', caseIds: ['CASE-2026-014'], personIds: ['person-001', 'person-002'], evidenceIds: ['EV-00187'], importance: 'MEDIUM' },
  { id: 'event-005', type: 'Wiretap', timestamp: '2026-08-14T22:07:55', date: '2026-08-14', time: '22:07', description: 'Intercepted conversation referencing upcoming financial transfer. Coded language detected.', caseIds: ['CASE-2026-014'], personIds: ['person-001', 'person-002'], evidenceIds: ['EV-01101'], importance: 'HIGH' },
  { id: 'event-006', type: 'Surveillance', timestamp: '2026-08-15T10:45:00', date: '2026-08-15', time: '10:45', description: 'Vehicles detected near JN Port. Marcus Thorne, Harish Nair, and Rohan Bose in proximity.', caseIds: ['CASE-2026-014'], personIds: ['person-001', 'person-015', 'person-020'], locationId: 'loc-007', evidenceIds: ['EV-00841'], importance: 'HIGH' },
  { id: 'event-007', type: 'Communication', timestamp: '2026-08-15T22:07:55', date: '2026-08-15', time: '22:07', description: 'Late-night call between Marcus Thorne and Victor Hale (34 min CDR)', caseIds: ['CASE-2026-014'], personIds: ['person-001', 'person-003'], evidenceIds: ['EV-00231'], importance: 'HIGH' },
  { id: 'event-008', type: 'Communication', timestamp: '2026-08-17T10:21:00', date: '2026-08-17', time: '10:21', description: 'Sarah Lin calls Victor Hale. Cross-city communication pattern.', caseIds: ['CASE-2026-014'], personIds: ['person-002', 'person-003'], evidenceIds: ['EV-00301'], importance: 'MEDIUM' },
  { id: 'event-009', type: 'Financial', timestamp: '2026-08-18T16:45:00', date: '2026-08-18', time: '16:45', description: 'Large cross-network transfer TX-00281 of ₹3.97 crore. Previously isolated clusters connected.', caseIds: ['CASE-2026-014'], personIds: ['person-001', 'person-004'], evidenceIds: ['EV-00612'], importance: 'HIGH' },
  { id: 'event-010', type: 'Surveillance', timestamp: '2026-08-18T12:20:00', date: '2026-08-18', time: '12:20', description: 'Victor Hale and Omar Shaikh at Ambattur Industrial Estate. Organization C premises.', caseIds: ['CASE-2026-014'], personIds: ['person-003', 'person-013'], locationId: 'loc-004', evidenceIds: ['EV-00901'], importance: 'MEDIUM' },
  { id: 'event-011', type: 'Communication', timestamp: '2026-08-20T11:45:00', date: '2026-08-20', time: '11:45', description: 'Marcus Thorne contacts David Park. CDR location consistent with warehouse area.', caseIds: ['CASE-2026-014'], personIds: ['person-001', 'person-006'], evidenceIds: ['EV-00342'], importance: 'LOW' },
  { id: 'event-012', type: 'Wiretap', timestamp: '2026-08-20T23:11:00', date: '2026-08-20', time: '23:11', description: 'Intercepted conversation: Port Complex mentioned. Upcoming delivery window discussed.', caseIds: ['CASE-2026-014'], personIds: ['person-001', 'person-003'], evidenceIds: ['EV-01141'], importance: 'HIGH' },
  { id: 'event-013', type: 'Surveillance', timestamp: '2026-08-22T19:00:00', date: '2026-08-22', time: '19:00', description: 'Marcus Thorne, Sarah Lin, and David Park observed together at Dharavi Warehouse. Third occurrence this month.', caseIds: ['CASE-2026-014'], personIds: ['person-001', 'person-002', 'person-006'], locationId: 'loc-001', evidenceIds: ['EV-00961'], importance: 'HIGH' },
  { id: 'event-014', type: 'Alert', timestamp: '2026-08-23T10:15:00', date: '2026-08-23', time: '10:15', description: 'System alert: Communication spike — 37 calls in 2-hour window from Marcus Thorne primary phone.', caseIds: ['CASE-2026-014'], personIds: ['person-001'], evidenceIds: ['EV-00401'], importance: 'HIGH' },
  { id: 'event-015', type: 'Financial', timestamp: '2026-08-25T07:30:00', date: '2026-08-25', time: '07:30', description: 'Rohan Bose observed at JN Port complex. Financial discrepancy flagged.', caseIds: ['CASE-2026-014'], personIds: ['person-020'], locationId: 'loc-007', evidenceIds: [], importance: 'MEDIUM' },
  { id: 'event-016', type: 'Surveillance', timestamp: '2026-08-25T14:03:00', date: '2026-08-25', time: '14:03', description: 'Marcus Thorne vehicle last observed at Dharavi Warehouse. Most recent surveillance record.', caseIds: ['CASE-2026-014'], personIds: ['person-001'], locationId: 'loc-001', evidenceIds: [], importance: 'LOW' },
];

// ── Data Sources ──────────────────────────────────────────────
export const dataSources: DataSource[] = [
  { id: 'ds-001', type: 'FIR', name: 'FIR & Police Reports', description: 'First Information Reports and supplementary police documentation from state police databases.', recordCount: 1247, processedCount: 1203, pendingCount: 44, lastUpdated: '2026-08-25T06:00:00', status: 'ONLINE', caseIds: ['CASE-2026-014', 'CASE-2026-009'] },
  { id: 'ds-002', type: 'CDR', name: 'Call Detail Records', description: 'Communication metadata from licensed telecom operators. Includes call logs, SMS metadata, and tower location data.', recordCount: 89412, processedCount: 87221, pendingCount: 2191, lastUpdated: '2026-08-25T12:00:00', status: 'ONLINE', caseIds: ['CASE-2026-014', 'CASE-2026-011', 'CASE-2026-009'] },
  { id: 'ds-003', type: 'FINANCIAL', name: 'Financial Transaction Records', description: 'Bank transaction records, FIU reports, suspicious transaction reports from financial intelligence units.', recordCount: 34891, processedCount: 33412, pendingCount: 1479, lastUpdated: '2026-08-25T09:00:00', status: 'ONLINE', caseIds: ['CASE-2026-014', 'CASE-2026-003'] },
  { id: 'ds-004', type: 'SURVEILLANCE', name: 'Surveillance Reports', description: 'Physical and digital surveillance reports from field units. Includes CCTV analysis and location tracking.', recordCount: 8742, processedCount: 8211, pendingCount: 531, lastUpdated: '2026-08-25T14:00:00', status: 'ONLINE', caseIds: ['CASE-2026-014', 'CASE-2026-011'] },
  { id: 'ds-005', type: 'SOCIAL_INTELLIGENCE', name: 'Social Intelligence', description: 'Open-source intelligence collected from social platforms and digital sources through authorized collection methods.', recordCount: 12334, processedCount: 11891, pendingCount: 443, lastUpdated: '2026-08-24T18:00:00', status: 'ONLINE', caseIds: ['CASE-2026-014', 'CASE-2026-010'] },
  { id: 'ds-006', type: 'CRIMINAL_HISTORY', name: 'Criminal History Database', description: 'NCRB criminal history records, previous case references, and prosecution data.', recordCount: 4521, processedCount: 4521, pendingCount: 0, lastUpdated: '2026-08-20T00:00:00', status: 'ONLINE', caseIds: ['CASE-2026-014', 'CASE-2026-008'] },
  { id: 'ds-007', type: 'INTELLIGENCE_REPORT', name: 'Intelligence Reports', description: 'Reports from NCRB Intelligence Division and partner intelligence agencies.', recordCount: 1891, processedCount: 1844, pendingCount: 47, lastUpdated: '2026-08-23T10:00:00', status: 'ONLINE', caseIds: ['CASE-2026-014', 'CASE-2026-009'] },
];

// ── Analytics / Chart Data ────────────────────────────────────
export const networkMetrics = {
  nodeCount: 687,
  edgeCount: 1492,
  density: 0.063,
  avgDegree: 4.34,
  communityCount: 18,
  bridgeNodes: 7,
  isolatedNodes: 14,
  maxCentrality: 0.81,
};

export const evidenceDistribution: ChartDataPoint[] = [
  { label: 'CDR', value: 142 },
  { label: 'Financial', value: 89 },
  { label: 'Surveillance', value: 67 },
  { label: 'FIR', value: 44 },
  { label: 'Wiretap', value: 31 },
  { label: 'Social Intel.', value: 38 },
  { label: 'Criminal Hist.', value: 22 },
  { label: 'Intel. Report', value: 19 },
];

export const communicationActivity: ChartDataPoint[] = [
  { label: '01 Aug', value: 24 },
  { label: '05 Aug', value: 31 },
  { label: '10 Aug', value: 28 },
  { label: '12 Aug', value: 47 },
  { label: '14 Aug', value: 56 },
  { label: '17 Aug', value: 38 },
  { label: '20 Aug', value: 41 },
  { label: '23 Aug', value: 89 },
  { label: '25 Aug', value: 61 },
];

export const financialActivity: ChartDataPoint[] = [
  { label: '01 Aug', value: 1200000 },
  { label: '05 Aug', value: 800000 },
  { label: '10 Aug', value: 32700000 },
  { label: '12 Aug', value: 4100000 },
  { label: '15 Aug', value: 1900000 },
  { label: '18 Aug', value: 39700000 },
  { label: '21 Aug', value: 2200000 },
  { label: '25 Aug', value: 900000 },
];

export const topConnectedPersons: ChartDataPoint[] = [
  { label: 'Marcus Thorne', value: 17 },
  { label: 'Sarah Lin', value: 12 },
  { label: 'Victor Hale', value: 10 },
  { label: 'Carlos Mendez', value: 8 },
  { label: 'Omar Shaikh', value: 6 },
  { label: 'Elena Rostova', value: 6 },
  { label: 'Rohan Bose', value: 5 },
];

export const getAlertsByCase = (caseId: string): Alert[] =>
  alerts.filter((a) => a.caseId === caseId);

export const getAlertsBySeverity = (severity: Alert['severity']): Alert[] =>
  alerts.filter((a) => a.severity === severity);

export const getEventsByCase = (caseId: string): InvestigationEvent[] =>
  investigationEvents.filter((e) => e.caseIds.includes(caseId));

export const getEventsByPerson = (personId: string): InvestigationEvent[] =>
  investigationEvents.filter((e) => e.personIds.includes(personId));
