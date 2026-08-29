// ============================================================
// NEXUS — Known Suspect Investigation Page
// SIH26189 | Network Expansion from Known Person
// ============================================================

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Fingerprint, ArrowRight, User } from 'lucide-react';
import AnalysisAnimation from '../components/investigation/AnalysisAnimation';
const persons: any[] = [];
const getGraphNodesByCase = (id: string) => [];
import { knownSuspectSteps, investigationCandidates } from '../services/investigationEngine';

type Stage = 'select' | 'analyzing' | 'results';

const KnownSuspectPage: React.FC = () => {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const [stage, setStage] = useState<Stage>('select');

  const casePersonNodeIds: string[] = [];

  const defaultPerson = casePersonNodeIds[0] ?? 'person-001';
  const [selectedPerson, setSelectedPerson] = useState<string>(defaultPerson);

  const selectablePrimary = casePersonNodeIds.slice(0, 5);
  const primaryPersons = persons.filter((p) => selectablePrimary.includes(p.id));
  const selected = persons.find((p) => p.id === selectedPerson);
  const base = caseId ? `/cases/${caseId}` : '';

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Fingerprint size={16} style={{ color: 'var(--accent-dim)' }} />
          <span className="intel-label">MODE 01 // KNOWN SUSPECT</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 300, color: 'var(--text-primary)' }}>
          Expand a Known Person's Network
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Start with a known person of interest and uncover connected individuals, organizations, locations and activities.
        </p>
      </div>

      {/* Select Stage */}
      {stage === 'select' && (
        <>
          <div className="section-header" style={{ marginBottom: '12px' }}>SELECT PERSON OF INTEREST</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
            {primaryPersons.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPerson(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 14px',
                  background: selectedPerson === p.id ? 'var(--accent-faint)' : 'var(--bg-surface)',
                  border: `1px solid ${selectedPerson === p.id ? 'var(--accent-dim)' : 'var(--border-dim)'}`,
                  cursor: 'pointer',
                  borderLeft: selectedPerson === p.id ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                {/* Avatar */}
                <div style={{ width: '36px', height: '36px', border: '1px solid var(--border-base)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)' }}>
                  <User size={16} style={{ color: selectedPerson === p.id ? 'var(--accent)' : 'var(--text-muted)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: selectedPerson === p.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {p.aliases.join(' · ')} · {p.occupation}
                  </div>
                </div>
                <span className={`badge badge--${p.priorityLevel === 'HIGH' ? 'high' : 'medium'}`}>
                  {p.investigationPriority}/100
                </span>
                <span className="data-value" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {p.connectionCount} connections
                </span>
              </div>
            ))}
          </div>

          {/* Selected Summary */}
          {selected && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)', padding: '14px 16px', marginBottom: '20px' }}>
              <div className="intel-label" style={{ marginBottom: '8px' }}>SELECTED PERSON OF INTEREST</div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div><div className="data-key">NAME</div><div className="data-value" style={{ fontSize: '0.9rem' }}>{selected.name}</div></div>
                <div><div className="data-key">INVESTIGATION PRIORITY</div><div className="data-value" style={{ color: 'var(--accent)' }}>{selected.investigationPriority}/100</div></div>
                <div><div className="data-key">NETWORK CONNECTIONS</div><div className="data-value">{selected.connectionCount}</div></div>
                <div><div className="data-key">EVIDENCE RECORDS</div><div className="data-value">{selected.evidenceCount}</div></div>
                <div><div className="data-key">CASE</div><div className="data-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{selected.caseIds[0]}</div></div>
              </div>
            </div>
          )}

          <button className="btn btn--accent" style={{ padding: '12px 24px' }} onClick={() => setStage('analyzing')}>
            ANALYZE NETWORK <ArrowRight size={12} />
          </button>
        </>
      )}

      {/* Analyzing Stage */}
      {stage === 'analyzing' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)' }}>
          <AnalysisAnimation
            steps={knownSuspectSteps}
            onComplete={() => setStage('results')}
            title="NETWORK ANALYSIS ENGINE"
          />
        </div>
      )}

      {/* Results Stage */}
      {stage === 'results' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div className="section-header">INVESTIGATION CANDIDATES</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                AI-assisted prioritization based on network structure, evidence, and observed activity. Investigator review required.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn--ghost" onClick={() => navigate(`${base}/network?center=${selectedPerson}`)}>
                VIEW NETWORK GRAPH
              </button>
              <button className="btn btn--ghost" onClick={() => navigate(`${base}/hypergraph`)} style={{ color: '#9B59B6', borderColor: 'rgba(155, 89, 182, 0.3)' }}>
                HYPERGRAPH VIEW
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {investigationCandidates.map((c) => {
              const p = persons.find((per) => per.id === c.personId);
              if (!p) return null;
              return (
                <div
                  key={c.personId}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-dim)',
                    borderLeft: `2px solid ${c.priorityLevel === 'HIGH' ? 'var(--accent)' : 'var(--border-base)'}`,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => navigate(`${base}/persons/${c.personId}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: '28px' }}>#{c.rank}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {p.aliases.join(' · ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 300 }}>{c.priority}</div>
                      <div className="intel-label" style={{ fontSize: '0.5rem' }}>INVESTIGATION PRIORITY</div>
                    </div>
                    <span className={`badge badge--${c.priorityLevel === 'HIGH' ? 'high' : 'medium'}`}>{c.priorityLevel}</span>
                  </div>

                  {/* Priority breakdown mini bars */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Network Centrality',     v: c.networkCentrality },
                      { label: 'Cross-Source Evidence',  v: c.crossSourceEvidence },
                      { label: 'Financial Indicators',   v: c.financialIndicators },
                      { label: 'Communication',          v: c.communicationPatterns },
                      { label: 'Location Correlation',   v: c.locationCorrelation },
                      { label: 'Behavioral Anomalies',   v: c.behavioralAnomalies },
                    ].map(({ label, v }) => (
                      <div key={label} style={{ minWidth: '120px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span className="intel-label" style={{ fontSize: '0.5rem' }}>{label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)' }}>{v}%</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${v * 4}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reasons */}
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {c.reasons.slice(0, 3).map((r) => (
                      <span key={r} style={{ fontSize: '0.6rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 7px', fontFamily: 'var(--font-mono)' }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
            ⚠ These are synthetic AI-assisted investigation leads and require investigator verification before any action.
          </div>
        </div>
      )}
    </div>
  );
};

export default KnownSuspectPage;
