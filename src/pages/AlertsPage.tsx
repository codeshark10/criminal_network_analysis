// ============================================================
// NEXUS — Intelligence Alerts Page
// ============================================================

import React, { useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { alerts } from '../data/alerts';
import type { Alert } from '../types';

const AlertsPage: React.FC = () => {
  const [severityFilter, setSeverityFilter] = useState<Alert['severity'] | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<Alert['status'] | 'ALL'>('ACTIVE');

  const filtered = alerts
    .filter((a) => severityFilter === 'ALL' || a.severity === severityFilter)
    .filter((a) => statusFilter === 'ALL' || a.status === statusFilter)
    .sort((a, b) => {
      const sev = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (sev[b.severity] || 0) - (sev[a.severity] || 0);
    });

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div className="section-header">INTELLIGENCE ALERTS</div>
        <h1 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 300 }}>Active Alerts & Anomalies</h1>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: '1px', marginBottom: '20px' }}>
        {[
          { label: 'CRITICAL/HIGH', count: alerts.filter((a) => a.severity === 'HIGH' && a.status === 'ACTIVE').length, cls: 'badge--critical' },
          { label: 'MEDIUM', count: alerts.filter((a) => a.severity === 'MEDIUM' && a.status === 'ACTIVE').length, cls: 'badge--medium' },
          { label: 'LOW', count: alerts.filter((a) => a.severity === 'LOW' && a.status === 'ACTIVE').length, cls: 'badge--low' },
          { label: 'ACKNOWLEDGED', count: alerts.filter((a) => a.status === 'ACKNOWLEDGED').length, cls: 'badge--closed' },
          { label: 'RESOLVED', count: alerts.filter((a) => a.status === 'RESOLVED').length, cls: 'badge--closed' },
        ].map(({ label, count, cls }) => (
          <div key={label} style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '10px 12px' }}>
            <div className="intel-label" style={{ marginBottom: '4px' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 300, color: 'var(--text-primary)' }}>{count}</div>
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
        {(['ACTIVE','ACKNOWLEDGED','RESOLVED','ALL'] as const).map((s) => (
          <button key={s} className={`btn ${statusFilter === s ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setStatusFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {filtered.map((alert) => (
          <div
            key={alert.id}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-dim)',
              borderLeft: `2px solid ${alert.severity === 'HIGH' ? 'var(--accent)' : alert.severity === 'MEDIUM' ? 'var(--accent-dim)' : 'var(--border-base)'}`,
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={13} style={{ color: alert.severity === 'HIGH' ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{alert.title}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <span className={`badge badge--${alert.severity === 'HIGH' ? 'high' : alert.severity === 'MEDIUM' ? 'medium' : 'low'}`}>{alert.severity}</span>
                <span className={`badge badge--${alert.status === 'ACTIVE' ? 'active' : 'closed'}`}>{alert.status}</span>
              </div>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alert.description}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span className="intel-label">{alert.category}</span>
              <span className="intel-label">CASE: {alert.caseId}</span>
              <span className="intel-label">DETECTED: {new Date(alert.detectedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              {alert.evidenceIds.length > 0 && <span className="intel-label">EVIDENCE: {alert.evidenceIds.join(', ')}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsPage;
