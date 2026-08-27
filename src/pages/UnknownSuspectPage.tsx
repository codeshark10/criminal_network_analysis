// ============================================================
// NEXUS — Unknown Suspect Investigation Page
// SIH26189 | Candidate Identification from Case Data
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowRight } from 'lucide-react';
import AnalysisAnimation from '../components/investigation/AnalysisAnimation';
const cases: any[] = [];
const persons: any[] = [];
import { unknownCaseSteps, investigationCandidates } from '../services/investigationEngine';

type Stage = 'select' | 'analyzing' | 'results';

const UnknownSuspectPage: React.FC = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('select');
  const [selectedCase, setSelectedCase] = useState('CASE-2026-014');

  const activeCases = cases.filter((c) => c.status === 'ACTIVE' || c.status === 'UNDER_REVIEW');
  const chosenCase = cases.find((c) => c.id === selectedCase);

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Brain size={16} style={{ color: 'var(--accent-dim)' }} />
          <span className="intel-label">MODE 02 // UNKNOWN SUSPECT</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 300 }}>
          Identify Investigation Candidates
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Analyze case intelligence to automatically prioritize persons requiring investigator review using graph analytics and pattern detection.
        </p>
      </div>

      {stage === 'select' && (
        <>
          <div className="section-header" style={{ marginBottom: '12px' }}>SELECT CASE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
            {activeCases.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c.id)}
                style={{
                  padding: '12px 16px',
                  background: selectedCase === c.id ? 'var(--accent-faint)' : 'var(--bg-surface)',
                  border: `1px solid ${selectedCase === c.id ? 'var(--accent-dim)' : 'var(--border-dim)'}`,
                  borderLeft: selectedCase === c.id ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: '200px 1fr auto auto auto',
                  gap: '16px',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.08em' }}>{c.id}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</div>
                </div>
                <div>
                  <div className="intel-label">EVIDENCE RECORDS</div>
                  <div className="data-value">{c.evidenceCount}</div>
                </div>
                <div>
                  <div className="intel-label">ENTITIES</div>
                  <div className="data-value">{c.entityCount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="intel-label">RELATIONSHIPS</div>
                  <div className="data-value">{c.relationshipCount.toLocaleString()}</div>
                </div>
                <span className={`badge badge--${c.priority === 'CRITICAL' ? 'critical' : c.priority === 'HIGH' ? 'high' : 'medium'}`}>{c.priority}</span>
              </div>
            ))}
          </div>

          {chosenCase && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)', padding: '14px 16px', marginBottom: '20px' }}>
              <div className="intel-label" style={{ marginBottom: '10px' }}>CASE INTELLIGENCE SUMMARY</div>
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Evidence Records',  value: chosenCase.evidenceCount },
                  { label: 'Entities Extracted', value: chosenCase.entityCount.toLocaleString() },
                  { label: 'Relationships',      value: chosenCase.relationshipCount.toLocaleString() },
                  { label: 'Persons of Interest', value: chosenCase.personsOfInterestCount },
                  { label: 'Network Size',        value: chosenCase.networkSize },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="data-key">{label}</div>
                    <div className="data-value" style={{ fontSize: '1.2rem', fontWeight: 300 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn--accent" style={{ padding: '12px 24px' }} onClick={() => setStage('analyzing')}>
            ANALYZE CASE <ArrowRight size={12} />
          </button>
        </>
      )}

      {stage === 'analyzing' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)' }}>
          <AnalysisAnimation
            steps={unknownCaseSteps}
            onComplete={() => setStage('results')}
            title="CASE ANALYSIS ENGINE"
          />
        </div>
      )}

      {stage === 'results' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div className="section-header">INVESTIGATION CANDIDATES</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              AI-assisted prioritization based on network structure, evidence relationships and observed activity. Investigator verification required.
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
                    display: 'grid',
                    gridTemplateColumns: '30px 1fr 180px 100px 60px',
                    gap: '14px',
                    alignItems: 'center',
                  }}
                  onClick={() => navigate(`/persons/${p.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{c.rank}</div>
                  <div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {p.aliases.join(' · ')} · {p.occupation}
                    </div>
                  </div>
                  <div>
                    <div className="intel-label" style={{ marginBottom: '3px' }}>PRIORITY SCORE</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="progress-track" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${c.priority}%` }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)' }}>{c.priority}</span>
                    </div>
                  </div>
                  <div>
                    <div className="data-key">EVIDENCE</div>
                    <div className="data-value">{c.evidenceCount} records</div>
                  </div>
                  <span className={`badge badge--${c.priorityLevel === 'HIGH' ? 'high' : 'medium'}`}>{c.priorityLevel}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
            <button className="btn btn--ghost" onClick={() => navigate('/network')}>
              VIEW NETWORK GRAPH
            </button>
            <button className="btn btn--ghost" onClick={() => navigate('/evidence')}>
              VIEW EVIDENCE
            </button>
          </div>

          <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
            ⚠ These are synthetic AI-assisted investigation leads and require investigator verification before any action is taken.
          </div>
        </div>
      )}
    </div>
  );
};

export default UnknownSuspectPage;
