import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { OverviewPage } from './pages/Overview'
import { InvestigationsPage, KnownSuspectPage, UnknownSuspectPage } from './pages/Investigations'
import { AlertsPage, EvidencePage, NetworkAnalysisPage, PersonsPage, TimelinePage } from './pages/Intelligence'
import { AnalyticsPage, DataSourcesPage, SettingsPage } from './pages/Operations'

export default function App() { return <Routes><Route element={<AppShell />}><Route index element={<Navigate to="/overview" replace />} /><Route path="overview" element={<OverviewPage />} /><Route path="investigations" element={<InvestigationsPage />} /><Route path="investigations/known-suspect" element={<KnownSuspectPage />} /><Route path="investigations/unknown-suspect" element={<UnknownSuspectPage />} /><Route path="network" element={<NetworkAnalysisPage />} /><Route path="persons" element={<PersonsPage />} /><Route path="persons/:personId" element={<PersonsPage />} /><Route path="evidence" element={<EvidencePage />} /><Route path="evidence/:evidenceId" element={<EvidencePage />} /><Route path="timeline" element={<TimelinePage />} /><Route path="alerts" element={<AlertsPage />} /><Route path="sources" element={<DataSourcesPage />} /><Route path="analytics" element={<AnalyticsPage />} /><Route path="settings" element={<SettingsPage />} /></Route><Route path="*" element={<Navigate to="/overview" replace />} /></Routes> }
