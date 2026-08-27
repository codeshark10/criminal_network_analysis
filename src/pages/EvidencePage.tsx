// ============================================================
// NEXUS — Evidence Intelligence Page
// ============================================================

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Evidence } from '../types';

const evidenceRecords: Evidence[] = [];

const EvidencePage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<Evidence['type'] | 'ALL'>('ALL');
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [searchQ, setSearchQ] = useState('');

  const types: (Evidence['type'] | 'ALL')[] = ['ALL','FIR','CDR','FINANCIAL','SURVEILLANCE','WIRETAP','SOCIAL_INTELLIGENCE','CRIMINAL_HISTORY','INTELLIGENCE_REPORT'];

  const filtered = evidenceRecords
    .filter((e) => typeFilter === 'ALL' || e.type === typeFilter)
    .filter((e) => !searchQ || e.id.includes(searchQ.toUpperCase()) || e.summary.toLowerCase().includes(searchQ.toLowerCase()));

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="section-header">EVIDENCE INTELLIGENCE</div>
          <h1 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 300 }}>Evidence Records</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input className="intel-input" placeholder="Search evidence..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} style={{ width: '200px' }} />
          <span className="intel-label">{filtered.length} records</span>
        </div>
      </div>

      {/* Type filters */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', overflowX: 'auto' }}>
        {types.map((t) => (
          <button
            key={t}
            className={`intel-tab ${typeFilter === t ? 'intel-tab--active' : ''}`}
            onClick={() => setTypeFilter(t)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Evidence table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table className="intel-table">
          <thead>
            <tr>
              <th>EVIDENCE ID</th>
              <th>TYPE</th>
              <th>DATE</th>
              <th>RELATED ENTITIES</th>
              <th>LOCATION</th>
              <th>CONFIDENCE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedEvidence(e)}>
                <td><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '0.7rem' }}>{e.id}</span></td>
                <td><span className={`badge badge--${e.flagged ? 'high' : 'closed'}`}>{e.type.replace(/_/g,' ')}</span></td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{e.date}</span></td>
                <td><span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{e.relatedPersonIds.length} persons, {e.relatedOrgIds.length} orgs</span></td>
                <td><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.city || '—'}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="progress-track" style={{ width: '50px' }}>
                      <div className="progress-fill" style={{ width: `${e.confidence}%` }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{e.confidence}%</span>
                  </div>
                </td>
                <td><span className={`badge badge--${e.status === 'FLAGGED' ? 'critical' : e.status === 'PROCESSED' ? 'active' : 'closed'}`}>{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Evidence Detail Drawer */}
      {selectedEvidence && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            display: 'flex', justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedEvidence(null)}
        >
          <div
            style={{
              width: '400px', height: '100%',
              background: 'var(--bg-panel)',
              borderLeft: '1px solid var(--border-base)',
              overflowY: 'auto', padding: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div className="section-header">{selectedEvidence.type.replace(/_/g,' ')}</div>
              <button onClick={() => setSelectedEvidence(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--accent)', marginBottom: '16px' }}>{selectedEvidence.id}</div>

            {[
              { key: 'Source',     val: selectedEvidence.source },
              { key: 'Date',       val: selectedEvidence.date },
              { key: 'Time',       val: selectedEvidence.time || '—' },
              { key: 'Location',   val: selectedEvidence.city || '—' },
              { key: 'Confidence', val: `${selectedEvidence.confidence}%` },
              { key: 'Status',     val: selectedEvidence.status },
            ].map(({ key, val }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-faint)' }}>
                <span className="data-key">{key.toUpperCase()}</span>
                <span className="data-value" style={{ fontSize: '0.72rem' }}>{val}</span>
              </div>
            ))}

            <div className="divider" style={{ margin: '12px 0' }} />
            <div className="intel-label" style={{ marginBottom: '8px' }}>SUMMARY</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedEvidence.summary}</p>

            {selectedEvidence.extractedRelationships.length > 0 && (
              <>
                <div className="divider" style={{ margin: '12px 0' }} />
                <div className="intel-label" style={{ marginBottom: '8px' }}>EXTRACTED RELATIONSHIPS</div>
                {selectedEvidence.extractedRelationships.map((r) => (
                  <div key={r} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent)', padding: '4px 0', borderBottom: '1px solid var(--border-faint)' }}>{r}</div>
                ))}
              </>
            )}

            <div className="divider" style={{ margin: '12px 0' }} />
            <div style={{ padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
              SYNTHETIC / DEMONSTRATION DATA — Not real law enforcement evidence
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidencePage;
