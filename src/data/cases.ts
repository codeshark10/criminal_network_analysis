export interface Case {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'UNDER_REVIEW';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  updatedAt: string;
  description: string;
  tags: string[];
  personsOfInterestCount: number;
  evidenceCount: number;
  entityCount: number;
  assignedTeam: string[];
  extractionStatus?: 'PENDING' | 'EXTRACTING' | 'VERIFYING' | 'COMPLETED';
}

export const cases: Case[] = [];
export const getCaseById = (id: string): Case | undefined => cases.find(c => c.id === id);
export const getActiveCases = (): Case[] => [];
export const getPastCases = (): Case[] => [];
export const getUnderReviewCases = (): Case[] => [];

export const getGlobalStats = () => {
  return {
    total: 0,
    active: 0,
    closed: 0,
    underReview: 0,
    totalEntities: 0,
    totalChunks: 0,
    unprocessedDocs: 0
  };
};

export const addCase = (newCase: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) => {
  // Removed static logic
  return null;
};
