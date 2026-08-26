// ============================================================
// NEXUS — App Router
// SIH26189 | AI-Powered Criminal Network Analysis
// ============================================================

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';

// Pages
import HomePage from './pages/HomePage';
import CasesPage from './pages/CasesPage';
import InvestigationsPage from './pages/InvestigationsPage';
import KnownSuspectPage from './pages/KnownSuspectPage';
import UnknownSuspectPage from './pages/UnknownSuspectPage';
import NetworkAnalysisPage from './pages/NetworkAnalysisPage';
import PersonsPage from './pages/PersonsPage';
import PersonProfilePage from './pages/PersonProfilePage';
import EvidencePage from './pages/EvidencePage';
import TimelinePage from './pages/TimelinePage';
import AlertsPage from './pages/AlertsPage';
import DataSourcesPage from './pages/DataSourcesPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Placeholder for settings
const SettingsPage = () => (
  <div style={{ padding: '24px' }}>
    <div className="section-header" style={{ marginBottom: '8px' }}>SYSTEM SETTINGS</div>
    <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
      Settings and configuration — Coming in Phase 12 implementation
    </p>
  </div>
);

// Case workspace placeholder
const CaseWorkspacePage = () => {
  const { id } = { id: window.location.pathname.split('/').pop() };
  return (
    <div style={{ padding: '24px' }}>
      <div className="section-header" style={{ marginBottom: '8px' }}>CASE WORKSPACE</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent)' }}>{id}</div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '8px' }}>
        Case workspace — Navigate using the sidebar to investigate network, evidence, and persons.
      </p>
    </div>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="cases/:id" element={<CaseWorkspacePage />} />
        <Route path="investigations" element={<InvestigationsPage />} />
        <Route path="investigations/known-suspect" element={<KnownSuspectPage />} />
        <Route path="investigations/unknown-suspect" element={<UnknownSuspectPage />} />
        <Route path="network" element={<NetworkAnalysisPage />} />
        <Route path="persons" element={<PersonsPage />} />
        <Route path="persons/:id" element={<PersonProfilePage />} />
        <Route path="evidence" element={<EvidencePage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="data-sources" element={<DataSourcesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
