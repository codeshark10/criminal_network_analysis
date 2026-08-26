// ============================================================
// NEXUS — Data Sources Page
// ============================================================

import React from 'react';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';
import { dataSources } from '../data/alerts';

const DataSourcesPage: React.FC = () => (
  <div style={{ padding: '24px', maxWidth: '800px' }}>
    <div style={{ marginBottom: '20px' }}>
      <div className="section-header">DATA SOURCES</div>
      <h1 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 300 }}>Connected Intelligence Sources</h1>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {dataSources.map((ds) => (
        <div key={ds.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px 18px', borderLeft: `2px solid ${ds.status === 'ONLINE' ? 'var(--operational)' : 'var(--critical)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={14} style={{ color: 'var(--accent-dim)' }} />
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{ds.name}</div>
                <div className="intel-label" style={{ marginTop: '2px' }}>{ds.type}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {ds.status === 'ONLINE' ? <CheckCircle size={12} style={{ color: '#6A9E6A' }} /> : <AlertCircle size={12} style={{ color: 'var(--critical)' }} />}
              <span className={`badge badge--${ds.status === 'ONLINE' ? 'active' : 'critical'}`}>{ds.status}</span>
            </div>
          </div>

          <p style={{ margin: '0 0 10px', fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{ds.description}</p>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'TOTAL RECORDS',     value: ds.recordCount.toLocaleString() },
              { label: 'PROCESSED',         value: ds.processedCount.toLocaleString() },
              { label: 'PENDING',           value: ds.pendingCount.toLocaleString() },
              { label: 'LAST UPDATED',      value: new Date(ds.lastUpdated).toLocaleDateString('en-IN', { dateStyle: 'medium' }) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="data-key">{label}</div>
                <div className="data-value" style={{ fontSize: '0.8rem' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '10px' }}>
            <div className="progress-track">
              <div className="progress-fill progress-fill--operational" style={{ width: `${(ds.processedCount / ds.recordCount) * 100}%` }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              {Math.round((ds.processedCount / ds.recordCount) * 100)}% PROCESSED
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default DataSourcesPage;
