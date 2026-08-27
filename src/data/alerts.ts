import type { EntityType } from '../types/graph';

export interface Alert {
  id: string;
  caseId: string;
  type: 'CRITICAL_NODE_DETECTED' | 'NEW_CONNECTION' | 'PATTERN_MATCH' | 'FINANCIAL_ANOMALY' | 'COMMUNICATION_SPIKE' | 'SYSTEM';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  timestamp: string;
  read: boolean;
  relatedEntities: string[];
  actionRequired?: boolean;
}

export const alerts: Alert[] = [];
export const investigationEvents: any[] = [];
export const networkMetrics = { density: 0, modularity: 0, averagePathLength: 0, activeComponents: 0, riskScore: 0 };
export const evidenceDistribution = { documents: 0, communications: 0, financial: 0, multimedia: 0, physical: 0, cyber: 0 };
export const communicationActivity: any[] = [];
export const topConnectedPersons: any[] = [];
export const dataSources: any[] = [];

export const getEventsByCase = (caseId: string) => [];
