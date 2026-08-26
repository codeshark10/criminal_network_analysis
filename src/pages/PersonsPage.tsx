// ============================================================
// NEXUS — Persons of Interest Page
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { persons } from '../data/persons';
import type { Person } from '../types';

const PersonsPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<Person['status'] | 'ALL'>('ALL');
  const [searchQ, setSearchQ] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'connections' | 'evidence'>('priority');

  const filtered = persons
    .filter((p) => statusFilter === 'ALL' || p.status === statusFilter)
    .filter((p) => !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.aliases.some((a) => a.toLowerCase().includes(searchQ.toLowerCase())))
    .sort((a, b) =>
      sortBy === 'priority' ? b.investigationPriority - a.investigationPriority :
      sortBy === 'connections' ? b.connectionCount - a.connectionCount :
      b.evidenceCount - a.evidenceCount
    );

  const statuses: (Person['status'] | 'ALL')[] = ['ALL','ACTIVE','UNDER_REVIEW','ARCHIVED'];

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="section-header">PERSONS OF INTEREST</div>
          <h1 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 300 }}>Intelligence Profiles</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input className="intel-input" placeholder="Search persons..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} style={{ width: '180px' }} />
          <select className="intel-input" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="priority">Sort: Priority</option>
            <option value="connections">Sort: Connections</option>
            <option value="evidence">Sort: Evidence</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)' }}>
        {statuses.map((s) => (
          <button key={s} className={`intel-tab ${statusFilter === s ? 'intel-tab--active' : ''}`}
            onClick={() => setStatusFilter(s)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {s} {s === 'ALL' ? `(${persons.length})` : `(${persons.filter((p) => p.status === s).length})`}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map((p, i) => (
          <div
            key={p.id}
            onClick={() => navigate(`/persons/${p.id}`)}
            style={{
              display: 'grid',
              gridTemplateColumns: '30px 220px 100px 90px 80px 80px 80px 120px 24px',
              gap: '12px',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-dim)',
              borderLeft: `2px solid ${p.priorityLevel === 'HIGH' ? 'var(--accent-dim)' : 'transparent'}`,
              marginBottom: '1px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{String(i + 1).padStart(2,'0')}</span>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>{p.aliases.join(' · ')}</div>
            </div>
            <span className={`badge badge--${p.status === 'ACTIVE' ? 'active' : p.status === 'UNDER_REVIEW' ? 'medium' : 'closed'}`}>{p.status.replace('_',' ')}</span>
            <div>
              <div className="intel-label">PRIORITY</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div className="progress-track" style={{ width: '40px' }}>
                  <div className="progress-fill" style={{ width: `${p.investigationPriority}%` }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent)' }}>{p.investigationPriority}</span>
              </div>
            </div>
            <div>
              <div className="intel-label">CONNECTIONS</div>
              <div className="data-value">{p.connectionCount}</div>
            </div>
            <div>
              <div className="intel-label">EVIDENCE</div>
              <div className="data-value">{p.evidenceCount}</div>
            </div>
            <div>
              <div className="intel-label">CENTRALITY</div>
              <div className="data-value">{p.networkCentrality.toFixed(2)}</div>
            </div>
            <div>
              <div className="intel-label">LAST OBSERVED</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                {p.lastObserved ? new Date(p.lastObserved).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
              </div>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonsPage;
