// ============================================================
// NEXUS — Analytics Page
// Network metrics + charts
// ============================================================

import React from 'react';
import { networkMetrics, evidenceDistribution, communicationActivity, topConnectedPersons } from '../data/alerts';

const BarChart: React.FC<{ data: { label: string; value: number }[]; title: string; unit?: string }> = ({ data, title, unit = '' }) => {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px' }}>
      <div className="section-header" style={{ marginBottom: '14px' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {data.map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '100px', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{label}</div>
            <div style={{ flex: 1, height: '12px', background: 'var(--bg-elevated)', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: `${(value / max) * 100}%`,
                background: 'rgba(201,184,106,0.3)',
                transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', width: '60px', textAlign: 'right' }}>
              {typeof value === 'number' && value > 1000000 ? `₹${(value / 10000000).toFixed(1)}Cr` : value.toLocaleString()}{unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsPage: React.FC = () => (
  <div style={{ padding: '24px', maxWidth: '900px' }}>
    <div style={{ marginBottom: '20px' }}>
      <div className="section-header">ANALYTICS</div>
      <h1 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 300 }}>Network Intelligence Analytics</h1>
    </div>

    {/* Network metrics */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '20px' }}>
      {[
        { label: 'Total Nodes',     value: networkMetrics.nodeCount.toLocaleString() },
        { label: 'Total Edges',     value: networkMetrics.edgeCount.toLocaleString() },
        { label: 'Network Density', value: networkMetrics.density.toFixed(3) },
        { label: 'Avg Degree',      value: networkMetrics.avgDegree.toFixed(2) },
        { label: 'Communities',     value: networkMetrics.communityCount },
        { label: 'Bridge Nodes',    value: networkMetrics.bridgeNodes },
        { label: 'Isolated Nodes',  value: networkMetrics.isolatedNodes },
        { label: 'Max Centrality',  value: networkMetrics.maxCentrality.toFixed(2) },
      ].map(({ label, value }) => (
        <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '12px 14px' }}>
          <div className="intel-label" style={{ marginBottom: '4px' }}>{label.toUpperCase()}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 300, color: 'var(--text-primary)' }}>{value}</div>
        </div>
      ))}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
      <BarChart data={evidenceDistribution} title="EVIDENCE BY TYPE" />
      <BarChart data={topConnectedPersons} title="TOP CONNECTED PERSONS" unit=" conn." />
    </div>

    <BarChart data={communicationActivity} title="COMMUNICATION ACTIVITY (AUGUST 2026)" unit=" calls" />

    <div style={{ marginTop: '16px', padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
      All analytics are based on synthetic demonstration data. Actual analytics will use production data sources.
    </div>
  </div>
);

export default AnalyticsPage;
