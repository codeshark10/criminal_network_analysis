// ============================================================
// NEXUS — App Router
// SIH26189 | AI-Powered Criminal Network Analysis System
// Multi-Case Architecture: Global Layout + Case-Specific Layout
// ============================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import CaseLayout from './components/layout/CaseLayout';

// Global pages
import HomePage from './pages/HomePage';
import CasesPage from './pages/CasesPage';
import PersonsPage from './pages/PersonsPage';
import PersonProfilePage from './pages/PersonProfilePage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DataSourcesPage from './pages/DataSourcesPage';

// Case-specific pages
import CaseOverviewPage from './pages/case/CaseOverviewPage';
import CaseDataPage from './pages/case/CaseDataPage';
import CaseChunksPage from './pages/case/CaseChunksPage';
import NetworkAnalysisPage from './pages/NetworkAnalysisPage';
import KnownSuspectPage from './pages/KnownSuspectPage';
import UnknownSuspectPage from './pages/UnknownSuspectPage';
import EvidencePage from './pages/EvidencePage';
import TimelinePage from './pages/TimelinePage';

// Settings placeholder
const SettingsPage = () => (
  <div style={{ padding: '28px' }}>
    <div className="section-header" style={{ marginBottom: '10px' }}>SYSTEM SETTINGS</div>
    <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
      Settings and configuration — Coming in Phase 12 implementation
    </p>
  </div>
);

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* ── GLOBAL LAYOUT (no sidebar) ──────────────────────── */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="persons" element={<PersonsPage />} />
        <Route path="persons/:id" element={<PersonProfilePage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="data-sources" element={<DataSourcesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* ── CASE-SPECIFIC LAYOUT (with case sidebar) ────────── */}
      <Route path="/cases/:caseId" element={<CaseLayout />}>
        {/* Default: redirect to overview */}
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<CaseOverviewPage />} />

        {/* Data pipeline pages */}
        <Route path="data" element={<CaseDataPage />} />
        <Route path="chunks" element={<CaseChunksPage />} />

        {/* Investigation pages */}
        <Route path="network" element={<NetworkAnalysisPage />} />
        <Route path="persons" element={<PersonsPage />} />
        <Route path="persons/:id" element={<PersonProfilePage />} />
        <Route path="evidence" element={<EvidencePage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />

        {/* Investigation modes */}
        <Route path="investigations/known-suspect" element={<KnownSuspectPage />} />
        <Route path="investigations/unknown-suspect" element={<UnknownSuspectPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
