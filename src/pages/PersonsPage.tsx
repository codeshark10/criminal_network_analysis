// ============================================================
// NEXUS — Persons of Interest Page
// Data from GET /api/suspects/top (FastAPI/Neo4j)
// Falls back to static data when backend is offline
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronRight, Loader2, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { getTopSuspects } from '../services/apiClient';
import { adaptSuspect } from '../services/adapters';
import type { SuspectDisplay } from '../services/adapters';

// ── Sub-components ────────────────────────────────────────────

const StatusBanner: React.FC<{ isLive: boolean; count: number; onRetry: () => void }> = ({ isLive, count, onRetry }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
    border: `1px solid ${isLive ? 'var(--operational)' : 'var(--warning)'}`,
    background: isLive ? 'rgba(58,94,58,0.12)' : 'rgba(107,90,42,0.12)',
    fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em',
    color: isLive ? '#6A9E6A' : '#D4B86A', flexShrink: 0,
  }}>
    {isLive ? <Database size={11} /> : <AlertTriangle size={11} />}
    {isLive
      ? `LIVE — ${count} SUSPECTS FROM NEO4J`
      : 'NO DATA / BACKEND OFFLINE'
    }
    {!isLive && (
      <button
        onClick={onRetry}
        style={{ background: 'none', border: '1px solid var(--warning)', padding: '2px 8px', cursor: 'pointer', color: '#D4B86A', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', marginLeft: '6px' }}
      >
        RETRY
      </button>
    )}
  </div>
);

// ── Main page ─────────────────────────────────────────────────

const PersonsPage: React.FC = () => {
  const { caseId } = useParams<{ caseId?: string }>();
  
  const [suspects, setSuspects] = useState<SuspectDisplay[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);

  const [searchQ, setSearchQ] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'connections' | 'mentions'>('priority');
  const [limitFilter, setLimitFilter] = useState<50 | 100 | 200>(100);

  const fetchSuspects = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const raw = await getTopSuspects(caseId, limitFilter);
      if (raw.length === 0) throw new Error('empty');
      const maxMentions = Math.max(...raw.map((s) => s.mentions), 1);
      setSuspects(raw.map((s) => adaptSuspect(s, maxMentions)));
      setIsLive(true);
    } catch {
      setSuspects([]);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, [limitFilter]);

  useEffect(() => { fetchSuspects(); }, [fetchSuspects]);

  const filtered = suspects
    .filter((s) => {
      if (!searchQ) return true;
      const q = searchQ.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.aliases.some((a) => a.toLowerCase().includes(q));
    })
    .sort((a, b) =>
      sortBy === 'priority'    ? b.priority - a.priority :
      sortBy === 'connections' ? b.connections - a.connections :
      b.mentions - a.mentions
    );

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div className="section-header">PERSONS OF INTEREST {caseId ? `— ${caseId}` : ''}</div>
          <h1 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 300 }}>Suspect Profiles</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {caseId && <StatusBanner isLive={isLive} count={suspects.length} onRetry={fetchSuspects} />}
        </div>
      </div>
      
      {!caseId ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          NO CASE SELECTED. PLEASE SELECT A CASE FROM THE HOMEPAGE TO VIEW SUSPECTS.
        </div>
      ) : (
        <>
          {/* Controls row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="intel-input"
          placeholder="Search name or alias..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          style={{ width: '200px' }}
        />
        <select className="intel-input" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
          <option value="priority">Sort: Priority</option>
          <option value="connections">Sort: Connections</option>
          <option value="mentions">Sort: Mentions</option>
        </select>
        {isLive && (
          <select
            className="intel-input"
            value={limitFilter}
            onChange={(e) => setLimitFilter(Number(e.target.value) as typeof limitFilter)}
          >
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
            <option value={200}>Top 200</option>
          </select>
        )}
        <button
          className="btn btn--ghost"
          style={{ fontSize: '0.65rem', padding: '5px 10px' }}
          onClick={fetchSuspects}
          disabled={loading}
        >
          <RefreshCw size={10} /> REFRESH
        </button>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
          {filtered.length} of {suspects.length} suspects
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '30px 1fr 110px 90px 80px 100px 24px',
        gap: '12px', alignItems: 'center',
        padding: '6px 14px',
        background: 'var(--bg-void)',
        borderBottom: '1px solid var(--border-dim)',
        flexShrink: 0,
      }}>
        <span />
        <span className="intel-label">NAME / ALIASES</span>
        <span className="intel-label">ROLE</span>
        <span className="intel-label">PRIORITY</span>
        <span className="intel-label">CONNS</span>
        <span className="intel-label">MENTIONS</span>
        <span />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '12px' }}>
            <Loader2 size={20} className="animate-spin-slow" style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              QUERYING NEO4J...
            </span>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {searchQ ? `No suspects matching "${searchQ}".` : 'No suspects found. Upload case documents to populate the database.'}
          </div>
        )}

        {!loading && filtered.map((s, i) => (
          <div
            key={s.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '30px 1fr 110px 90px 80px 100px 24px',
              gap: '12px', alignItems: 'center',
              padding: '10px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-dim)',
              borderLeft: `2px solid ${s.priority >= 75 ? 'var(--critical)' : s.priority >= 50 ? 'var(--accent-dim)' : 'transparent'}`,
              marginBottom: '1px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
          >
            {/* Rank */}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Name + aliases */}
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</div>
              {s.aliases.length > 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                  {s.aliases.slice(0, 3).join(' · ')}
                </div>
              )}
              {s.associatedCases.length > 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--accent-dim)', marginTop: '1px' }}>
                  {s.associatedCases.slice(0, 2).join(', ')}
                </div>
              )}
            </div>

            {/* Role */}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.62rem', padding: '2px 6px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
              color: ['SUSPECT', 'TARGET', 'PERPETRATOR', 'ACCUSED'].includes(s.role.toUpperCase())
                ? 'var(--critical)' : 'var(--text-secondary)',
              letterSpacing: '0.06em', textAlign: 'center',
            }}>
              {s.role}
            </span>

            {/* Priority bar */}
            <div>
              <div className="intel-label" style={{ marginBottom: '2px' }}>PRIORITY</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div className="progress-track" style={{ width: '40px' }}>
                  <div className="progress-fill" style={{ width: `${s.priority}%` }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent)' }}>{s.priority}</span>
              </div>
            </div>

            {/* Connections */}
            <div>
              <div className="intel-label">CONNS</div>
              <div className="data-value">{s.connections}</div>
            </div>

            {/* Mentions */}
            <div>
              <div className="intel-label">MENTIONS</div>
              <div className="data-value">{s.mentions}</div>
            </div>

            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
        ))}
      </div>
        </>
      )}
    </div>
  );
};

export default PersonsPage;
