// ============================================================
// NEXUS — Mastermind Analysis Page
// Data from GET /api/cases/{caseId}/mastermind
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Target, Loader2, AlertTriangle, Crown } from 'lucide-react';
import { getMastermindAnalysis } from '../../services/apiClient';
import type { MastermindResponse, MastermindSuspect } from '../../services/apiClient';

const MastermindAnalysisPage: React.FC = () => {
  const { caseId } = useParams<{ caseId?: string }>();
  const [data, setData] = useState<MastermindResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sorting
  const [sortCol, setSortCol] = useState<keyof MastermindSuspect>('mastermind_index');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    if (!caseId) return;
    
    setLoading(true);
    setError(null);
    getMastermindAnalysis(caseId)
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [caseId]);

  const handleSort = (col: keyof MastermindSuspect) => {
    if (sortCol === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortCol(col);
      setSortDesc(true);
    }
  };

  const sortedSuspects = data?.suspects.slice().sort((a, b) => {
    const aVal = a[sortCol];
    const bVal = b[sortCol];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDesc ? bVal - aVal : aVal - bVal;
    }
    return 0;
  }) || [];

  const SortableHeader = ({ label, col }: { label: string; col: keyof MastermindSuspect }) => (
    <span 
      className="intel-label" 
      onClick={() => handleSort(col)}
      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
    >
      {label}
      {sortCol === col && (sortDesc ? ' ↓' : ' ↑')}
    </span>
  );

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div className="section-header">MASTERMIND & CENTRALITY ANALYSIS {caseId ? `— ${caseId}` : ''}</div>
          <h1 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 300 }}>Network Centrality Metrics</h1>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginTop: '8px' }}>
            Scores are standard deviations (Z-scores) relative to the network average.
          </p>
        </div>
      </div>

      {!caseId ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          NO CASE SELECTED. PLEASE SELECT A CASE FROM THE HOMEPAGE TO VIEW ANALYSIS.
        </div>
      ) : (
        <>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '12px' }}>
              <Loader2 size={20} className="animate-spin-slow" style={{ color: 'var(--accent)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                COMPUTING NETWORK CENTRALITY MATRICES...
              </span>
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: '20px', background: 'rgba(107,90,42,0.12)', border: '1px solid var(--warning)', color: '#D4B86A', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} />
              {error === 'empty' ? 'Not enough network data to calculate mastermind metrics. Please upload more case files.' : `Error: ${error}`}
            </div>
          )}

          {!loading && !error && data && data.suspects.length === 0 && (
            <div style={{ padding: '20px', background: 'rgba(107,90,42,0.12)', border: '1px solid var(--warning)', color: '#D4B86A', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} />
              Not enough network data to calculate mastermind metrics. Please upload more case files.
            </div>
          )}

          {!loading && !error && data && data.suspects.length > 0 && (
            <>
              {/* Top Suspect Banner */}
              {data.top_suspect && data.top_suspect !== 'None' && (
                <div style={{ padding: '16px 20px', background: 'rgba(212, 184, 106, 0.15)', border: '1px solid #D4B86A', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', background: '#D4B86A', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                    <Target size={18} style={{ color: '#000' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#D4B86A', letterSpacing: '0.1em' }}>🚨 SYSTEM DESIGNATES TOP SUSPECT</div>
                    <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 500 }}>{data.top_suspect}</div>
                  </div>
                </div>
              )}

              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 1fr 1fr 1fr',
                gap: '12px', alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--bg-void)',
                borderBottom: '1px solid var(--border-dim)',
                flexShrink: 0,
              }}>
                <span className="intel-label">RANK</span>
                <SortableHeader label="NAME" col="name" />
                <SortableHeader label="MASTERMIND IDX" col="mastermind_index" />
                <SortableHeader label="HYPERDEGREE" col="hyperdegree" />
                <SortableHeader label="BETWEENNESS" col="betweenness" />
                <SortableHeader label="PAGERANK" col="pagerank" />
                <SortableHeader label="DEGREE" col="degree_centrality" />
                <SortableHeader label="CLOSENESS" col="closeness" />
              </div>

              {/* List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {sortedSuspects.map((s, i) => {
                  const isTopSuspect = data.top_suspect === s.name;
                  const isTopThree = i < 3;
                  return (
                    <div
                      key={s.name}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 1fr 1fr 1fr',
                        gap: '12px', alignItems: 'center',
                        padding: '12px 14px',
                        background: isTopSuspect ? 'rgba(212, 184, 106, 0.08)' : 'var(--bg-surface)',
                        borderBottom: '1px solid var(--border-faint)',
                        borderLeft: `2px solid ${isTopSuspect ? '#D4B86A' : isTopThree ? 'var(--critical)' : 'transparent'}`,
                        fontWeight: isTopThree ? 600 : 400,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isTopSuspect) e.currentTarget.style.background = 'var(--bg-raised)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isTopSuspect) e.currentTarget.style.background = 'var(--bg-surface)';
                      }}
                    >
                      {/* Rank */}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: isTopThree ? 'var(--critical)' : 'var(--text-muted)' }}>
                        #{i + 1}
                      </span>

                      {/* Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: isTopThree ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.name}</span>
                        {isTopSuspect && <Crown size={14} style={{ color: '#D4B86A' }} />}
                      </div>

                      {/* Mastermind Index */}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)' }}>
                        {s.mastermind_index.toFixed(2)}
                      </span>

                      {/* Hyperdegree */}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                        {s.hyperdegree}
                      </span>

                      {/* Betweenness */}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {s.betweenness.toFixed(2)}
                      </span>

                      {/* PageRank */}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {s.pagerank.toFixed(2)}
                      </span>

                      {/* Degree */}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {s.degree_centrality.toFixed(2)}
                      </span>

                      {/* Closeness */}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {s.closeness.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MastermindAnalysisPage;
