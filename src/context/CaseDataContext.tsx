// ============================================================
// NEXUS — Case Data Context
// Provides frontend-processed chunks, documents and alerts
// to any page that imports useCaseData()
// ============================================================

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { ExtractedChunk, Alert } from '../types';
import {
  processDocuments as runProcessor,
  saveChunks, loadChunks,
  saveAlerts, loadAlerts,
  saveDocuments, loadDocuments,
  clearCaseData,
  computeChunkCounts,
  type StoredDocument,
  type ProcessingResult,
} from '../services/documentProcessor';

// ── Context shape ─────────────────────────────────────────────

interface CaseDataContextValue {
  /** Get all extracted chunks for a case (from localStorage) */
  getChunks: (caseId: string) => ExtractedChunk[];
  /** Get generated alerts for a case */
  getAlerts: (caseId: string) => Alert[];
  /** Get stored document metadata for a case */
  getDocuments: (caseId: string) => StoredDocument[];
  /** Process uploaded files, persist results, return summary */
  processUploadedFiles: (caseId: string, files: File[]) => Promise<ProcessingResult>;
  /** Clear all local data for a case */
  clearCase: (caseId: string) => void;
  /** Add a global alert (caseId = 'global') */
  addGlobalAlert: (alert: Omit<Alert, 'id' | 'detectedAt'>) => void;
  /** Add an alert to a specific case */
  addCaseAlert: (caseId: string, alert: Omit<Alert, 'id' | 'detectedAt'>) => void;
  /** Whether processing is currently in progress */
  isProcessing: boolean;
}

const CaseDataContext = createContext<CaseDataContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────

export const CaseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Simple cache: caseId → processed data (avoids re-reading localStorage on every call)
  const [chunkCache, setChunkCache] = useState<Record<string, ExtractedChunk[]>>({});
  const [alertCache, setAlertCache] = useState<Record<string, Alert[]>>({});
  const [docCache, setDocCache] = useState<Record<string, StoredDocument[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const getChunks = useCallback(
    (caseId: string): ExtractedChunk[] => {
      if (chunkCache[caseId]) return chunkCache[caseId];
      const persisted = loadChunks(caseId);
      if (persisted.length > 0) {
        setChunkCache((prev) => ({ ...prev, [caseId]: persisted }));
      }
      return persisted;
    },
    [chunkCache]
  );

  const getAlerts = useCallback(
    (caseId: string): Alert[] => {
      if (alertCache[caseId]) return alertCache[caseId];
      const persisted = loadAlerts(caseId);
      if (persisted.length > 0) {
        setAlertCache((prev) => ({ ...prev, [caseId]: persisted }));
      }
      return persisted;
    },
    [alertCache]
  );

  const getDocuments = useCallback(
    (caseId: string): StoredDocument[] => {
      if (docCache[caseId]) return docCache[caseId];
      const persisted = loadDocuments(caseId);
      if (persisted.length > 0) {
        setDocCache((prev) => ({ ...prev, [caseId]: persisted }));
      }
      return persisted;
    },
    [docCache]
  );

  const processUploadedFiles = useCallback(
    async (caseId: string, files: File[]): Promise<ProcessingResult> => {
      setIsProcessing(true);
      try {
        const result = await runProcessor(caseId, files);

        // Merge with any existing data for this case
        const existingChunks = loadChunks(caseId);
        const existingAlerts = loadAlerts(caseId);
        const existingDocs = loadDocuments(caseId);

        // Deduplicate chunks by id
        const chunkMap = new Map<string, ExtractedChunk>();
        [...existingChunks, ...result.chunks].forEach((c) => chunkMap.set(c.id, c));
        const mergedChunks = [...chunkMap.values()];

        // Deduplicate alerts by id
        const alertMap = new Map<string, Alert>();
        [...existingAlerts, ...result.alerts].forEach((a) => alertMap.set(a.id, a));
        const mergedAlerts = [...alertMap.values()];

        // Build document records from files
        const newDocs: StoredDocument[] = files.map((file) => ({
          id: `${caseId}-doc-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
          caseId,
          fileName: file.name,
          fileType: 'text/plain',
          uploadedAt: new Date().toISOString(),
          size: file.size,
          status: 'PROCESSED' as const,
          chunkCount: result.chunks.filter((c) =>
            c.documentId === `${caseId}-doc-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`
          ).length,
        }));

        // Deduplicate docs by id
        const docMap = new Map<string, StoredDocument>();
        [...existingDocs, ...newDocs].forEach((d) => docMap.set(d.id, d));
        const mergedDocs = [...docMap.values()];

        // Persist
        saveChunks(caseId, mergedChunks);
        saveAlerts(caseId, mergedAlerts);
        saveDocuments(caseId, mergedDocs);

        // Update in-memory caches
        setChunkCache((prev) => ({ ...prev, [caseId]: mergedChunks }));
        setAlertCache((prev) => ({ ...prev, [caseId]: mergedAlerts }));
        setDocCache((prev) => ({ ...prev, [caseId]: mergedDocs }));

        // Return updated totals
        return {
          chunks: mergedChunks,
          alerts: mergedAlerts,
          documentCount: mergedDocs.length,
          chunkCounts: computeChunkCounts(mergedChunks),
        };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const clearCase = useCallback((caseId: string) => {
    clearCaseData(caseId);
    setChunkCache((prev) => { const next = { ...prev }; delete next[caseId]; return next; });
    setAlertCache((prev) => { const next = { ...prev }; delete next[caseId]; return next; });
    setDocCache((prev) => { const next = { ...prev }; delete next[caseId]; return next; });
  }, []);

  const addGlobalAlert = useCallback((alertData: Omit<Alert, 'id' | 'detectedAt'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert-global-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      detectedAt: new Date().toISOString()
    };
    const currentGlobal = loadAlerts('global');
    const updated = [newAlert, ...currentGlobal];
    saveAlerts('global', updated);
    setAlertCache((prev) => ({ ...prev, 'global': updated }));
  }, []);

  const addCaseAlert = useCallback((caseId: string, alertData: Omit<Alert, 'id' | 'detectedAt'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert-case-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      detectedAt: new Date().toISOString()
    };
    const currentCaseAlerts = loadAlerts(caseId);
    const updated = [newAlert, ...currentCaseAlerts];
    saveAlerts(caseId, updated);
    setAlertCache((prev) => ({ ...prev, [caseId]: updated }));
  }, []);

  return (
    <CaseDataContext.Provider value={{
      getChunks, getAlerts, getDocuments,
      processUploadedFiles, clearCase, addGlobalAlert, addCaseAlert, isProcessing,
    }}>
      {children}
    </CaseDataContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────

export function useCaseData(): CaseDataContextValue {
  const ctx = useContext(CaseDataContext);
  if (!ctx) throw new Error('useCaseData must be used inside <CaseDataProvider>');
  return ctx;
}
