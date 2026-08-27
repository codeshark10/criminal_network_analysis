// ============================================================
// NEXUS — Intelligence Alerts Page
// Works in both global context and case-specific context.
// When inside /cases/:caseId/alerts, loads case-specific alerts
// generated from the uploaded documents.
// ============================================================

import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Activity, Check } from 'lucide-react';
import { useParams } from 'react-router-dom';
import type { Alert } from '../types';
import { useCaseData } from '../context/CaseDataContext';

const severityColor = {
  HIGH:   'var(--accent)',
  MEDIUM: 'var(--warning)',
  LOW:    'var(--text-muted)',
};

const severityBg = {
  HIGH:   'var(--critical-soft)',
  MEDIUM: 'rgba(180,140,50,0.08)',
  LOW:    'var(--bg-elevated)',
};

const AlertCard: React.FC<{ alert: Alert; onAck: (id: string) => void }> = ({ alert, onAck }) => (
  <div
    style={{
      background: alert.status === 'ACKNOWLEDGED' ? 'var(--bg-elevated)' : severityBg[alert.severity],
      border: '1px solid var(--border-dim)',
      borderLeft: `3px solid ${alert.status === 'ACKNOWLEDGED' ? 'var(--border-base)' : severityColor[alert.severity]}`,
      padding: '14px 16px',
      opacity: alert.status === 'ACKNOWLEDGED' ? 0.65 : 1,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={13} style={{ color: alert.status === 'ACKNOWLEDGED' ? 'var(--text-muted)' : severityColor[alert.severity], flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{alert.title}</div>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
        <span className={`badge badge--${alert.severity === 'HIGH' ? 'high' : alert.severity === 'MEDIUM' ? 'medium' : 'low'}`}>
          {alert.severity}
        </span>
        <span className={`badge badge--${alert.status === 'ACTIVE' ? 'active' : 'closed'}`}>
          {alert.status}
        </span>
        {alert.status === 'ACTIVE' && (
          <button
            onClick={() => onAck(alert.id)}
            title="Acknowledge"
            style={{ background: 'none', border: '1px solid var(--border-base)', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem' }}
          >
            <Check size={10} /> ACK
          </button>
        )}
      </div>
    </div>

    {/* Description — may include newlines for structured info */}
    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '10px', whiteSpace: 'pre-line' }}>
      {alert.description}
    </div>

    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <span className="intel-label">{alert.category}</span>
      {alert.caseId && <span className="intel-label">CASE: {alert.caseId}</span>}
      <span className="intel-label">
        DETECTED: {new Date(alert.detectedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
      </span>
      {alert.evidenceIds.length > 0 && (
        <span className="intel-label">{alert.evidenceIds.length} LINKED CHUNK(S)</span>
      )}
    </div>
  </div>
);

const AlertsPage: React.FC = () => {
  const { caseId } = useParams<{ caseId?: string }>();
  const { getAlerts } = useCaseData();

  // In case context load case-specific alerts; globally, show nothing (no global alert source yet)
  const rawAlerts: Alert[] = caseId ? getAlerts(caseId) : [];

  const [localAlerts, setLocalAlerts] = useState<Alert[]>(rawAlerts);
  const [severityFilter, setSeverityFilter] = useState<Alert['severity'] | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<Alert['status'] | 'ALL'>('ACTIVE');

  // Sync when caseId changes (e.g. navigating between cases)
  React.useEffect(() => {
    setLocalAlerts(caseId ? getAlerts(caseId) : []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const handleAck = (alertId: string) => {
    setLocalAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' as const } : a))
    );
  };

  const filtered = localAlerts
    .filter((a) => severityFilter === 'ALL' || a.severity === severityFilter)
    .filter((a) => statusFilter === 'ALL' || a.status === statusFilter)
    .sort((a, b) => {
      const sev = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (sev[b.severity] || 0) - (sev[a.severity] || 0);
    });

  const activeHigh   = localAlerts.filter((a) => a.severity === 'HIGH'   && a.status === 'ACTIVE').length;
  const activeMedium = localAlerts.filter((a) => a.severity === 'MEDIUM' && a.status === 'ACTIVE').length;
  const activeLow    = localAlerts.filter((a) => a.severity === 'LOW'    && a.status === 'ACTIVE').length;
  const ackCount     = localAlerts.filter((a) => a.status === 'ACKNOWLEDGED').length;

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <ShieldAlert size={16} style={{ color: 'var(--accent)' }} />
          <div className="section-header">INTELLIGENCE ALERTS</div>
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 300 }}>
          Active Alerts &amp; Anomalies
        </h1>
        {caseId && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--accent-dim)', marginTop: '4px' }}>
            CASE: {caseId}
          </div>
        )}
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: '1px', marginBottom: '20px' }}>
        {[
          { label: 'HIGH / CRITICAL', count: activeHigh,   color: 'var(--accent)' },
          { label: 'MEDIUM',          count: activeMedium,  color: 'var(--warning)' },
          { label: 'LOW',             count: activeLow,     color: 'var(--text-muted)' },
          { label: 'ACKNOWLEDGED',    count: ackCount,      color: 'var(--text-muted)' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '10px 12px' }}>
            <div className="intel-label" style={{ marginBottom: '4px' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 300, color }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(['ALL','HIGH','MEDIUM','LOW'] as const).map((s) => (
          <button key={s} className={`btn ${severityFilter === s ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setSeverityFilter(s)}>
            {s}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {(['ACTIVE','ACKNOWLEDGED','ALL'] as const).map((s) => (
          <button key={s} className={`btn ${statusFilter === s ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setStatusFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      {filtered.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)' }}>
          <Activity size={24} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            {localAlerts.length === 0
              ? 'NO ALERTS — UPLOAD CASE DOCUMENTS TO GENERATE ALERTS'
              : 'NO ALERTS MATCH THE CURRENT FILTER'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filtered.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onAck={handleAck} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
