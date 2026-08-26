// ============================================================
// NEXUS — Cases Page
// SIH26189 | Active + Past + Create New Case
// ============================================================

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, FolderOpen, Archive, Clock, ChevronRight, X, ArrowRight } from 'lucide-react';
import { cases, getActiveCases, getPastCases, getUnderReviewCases } from '../data/cases';
import type { Case, CasePriority, CaseType } from '../types';

// ── Create Case Modal ─────────────────────────────────────────
const CreateCaseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', type: 'FINANCIAL_CRIME' as CaseType, description: '',
    priority: 'HIGH' as CasePriority, officer: '',
  });
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [created, setCreated] = useState(false);

  const sources = ['FIR', 'CDR', 'FINANCIAL', 'SURVEILLANCE', 'INTELLIGENCE', 'CRIMINAL HISTORY', 'SOCIAL INTELLIGENCE'];

  const handleCreate = () => {
    setCreated(true);
    setTimeout(() => { navigate('/cases/CASE-2026-014'); }, 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ width: '560px', maxWidth: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="section-header">CREATE NEW CASE</div>
            <div className="intel-label" style={{ marginTop: '2px' }}>STEP {step} OF 5</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: '1px', padding: '0 20px', paddingTop: '12px' }}>
          {['CASE INFO','DATA SOURCES','IMPORT DATA','EXTRACT ENTITIES','CREATE'].map((s, i) => (
            <div key={s} style={{ flex: 1, height: '2px', background: i + 1 <= step ? 'var(--accent)' : 'var(--border-dim)' }} />
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {!created ? (
            <>
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="intel-label">CASE INFORMATION</div>
                  <input className="intel-input" style={{ width: '100%' }} placeholder="Case Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <select className="intel-input" style={{ width: '100%' }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CaseType })}>
                    {['FINANCIAL_CRIME','ORGANIZED_CRIME','CYBERCRIME','NARCOTICS','MONEY_LAUNDERING','FRAUD'].map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g,' ')}</option>
                    ))}
                  </select>
                  <textarea className="intel-input" style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} placeholder="Case Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <select className="intel-input" style={{ flex: 1 }} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as CasePriority })}>
                      {['CRITICAL','HIGH','MEDIUM','LOW'].map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input className="intel-input" style={{ flex: 1 }} placeholder="Investigating Officer" value={form.officer} onChange={(e) => setForm({ ...form, officer: e.target.value })} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="intel-label" style={{ marginBottom: '12px' }}>SELECT DATA SOURCES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sources.map((s) => (
                      <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: selectedSources.includes(s) ? 'var(--accent-faint)' : 'var(--bg-elevated)', border: `1px solid ${selectedSources.includes(s) ? 'var(--accent-dim)' : 'var(--border-dim)'}`, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(s)}
                          onChange={() => setSelectedSources((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: selectedSources.includes(s) ? 'var(--accent)' : 'var(--text-secondary)', letterSpacing: '0.08em' }}>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="intel-label" style={{ marginBottom: '12px' }}>IMPORT EXISTING INTELLIGENCE</div>
                  <div style={{ padding: '20px', border: '1px dashed var(--border-base)', textAlign: 'center', marginBottom: '12px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>DROP FILES OR CLICK TO IMPORT</div>
                    <div className="intel-label">SUPPORTED: .csv .xlsx .json .xml</div>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)' }}>
                    <div className="intel-label" style={{ marginBottom: '6px' }}>SYNTHETIC DEMONSTRATION DATA</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setStep(4)}>
                      → LOAD DEMO DATASET (CASE-2026-014)
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <div className="intel-label" style={{ marginBottom: '12px' }}>EXTRACTED ENTITIES</div>
                  {[
                    { label: 'Persons',       value: 17, color: 'var(--accent)' },
                    { label: 'Organizations', value: 8,  color: 'var(--text-secondary)' },
                    { label: 'Locations',     value: 13, color: 'var(--text-secondary)' },
                    { label: 'Phone Numbers', value: 15, color: 'var(--text-secondary)' },
                    { label: 'Vehicles',      value: 11, color: 'var(--text-secondary)' },
                    { label: 'Accounts',      value: 15, color: 'var(--text-secondary)' },
                    { label: 'Transactions',  value: 47, color: 'var(--text-secondary)' },
                    { label: 'Events',        value: 89, color: 'var(--text-secondary)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-faint)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color }}>{value} identified</span>
                    </div>
                  ))}
                </div>
              )}

              {step === 5 && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="section-header" style={{ marginBottom: '12px' }}>READY TO CREATE CASE</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    {form.name || 'New Investigation'} · {form.priority} · {form.type.replace(/_/g,' ')}
                  </div>
                  <button className="btn btn--accent" style={{ padding: '12px 24px' }} onClick={handleCreate}>
                    CREATE CASE <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '2rem', color: 'var(--accent)', marginBottom: '8px' }}>✓</div>
              <div className="section-header" style={{ marginBottom: '8px' }}>CASE CREATED SUCCESSFULLY</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Navigating to case workspace…
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!created && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn--ghost" onClick={() => step > 1 ? setStep(step - 1) : onClose()}>
              {step > 1 ? 'BACK' : 'CANCEL'}
            </button>
            <button className="btn btn--accent" onClick={() => step < 5 ? setStep(step + 1) : handleCreate()}>
              {step < 5 ? 'NEXT' : 'CREATE CASE'} <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Cases Page ────────────────────────────────────────────────
const CasesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'active';
  const showCreate = searchParams.get('create') === 'true';

  const activeCases = getActiveCases();
  const pastCases = getPastCases();
  const underReview = getUnderReviewCases();

  const displayCases = tab === 'active' ? activeCases : tab === 'past' ? pastCases : underReview;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div className="section-header">CASE INTELLIGENCE</div>
          <h1 style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 300, color: 'var(--text-primary)' }}>
            Investigation Cases
          </h1>
        </div>
        <button className="btn btn--accent" onClick={() => setSearchParams({ create: 'true' })}>
          <Plus size={12} /> CREATE NEW CASE
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', marginBottom: '20px' }}>
        {[
          { key: 'active', label: 'ACTIVE', icon: FolderOpen, count: activeCases.length },
          { key: 'past',   label: 'PAST',   icon: Archive,    count: pastCases.length },
          { key: 'review', label: 'UNDER REVIEW', icon: Clock, count: underReview.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            className={`intel-tab ${tab === key ? 'intel-tab--active' : ''}`}
            onClick={() => setSearchParams({ tab: key })}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Icon size={11} />
            {label}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', background: 'var(--bg-elevated)', padding: '1px 5px' }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Cases list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {displayCases.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate(`/cases/${c.id}`)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-dim)',
              borderLeft: `2px solid ${c.priority === 'CRITICAL' ? 'var(--critical)' : c.priority === 'HIGH' ? 'var(--accent-dim)' : 'var(--border-base)'}`,
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'background 0.15s',
              display: 'grid',
              gridTemplateColumns: '180px 80px 80px 1fr 1fr 1fr 100px 24px',
              gap: '12px',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.08em' }}>{c.id}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, marginTop: '2px' }}>{c.name}</div>
            </div>
            <span className={`badge badge--${c.status === 'ACTIVE' ? 'active' : 'closed'}`}>{c.status}</span>
            <span className={`badge badge--${c.priority === 'CRITICAL' ? 'critical' : c.priority === 'HIGH' ? 'high' : 'medium'}`}>{c.priority}</span>
            <div>
              <div className="intel-label">PERSONS</div>
              <div className="data-value">{c.personsOfInterestCount}</div>
            </div>
            <div>
              <div className="intel-label">EVIDENCE</div>
              <div className="data-value">{c.evidenceCount}</div>
            </div>
            <div>
              <div className="intel-label">ENTITIES</div>
              <div className="data-value">{c.entityCount.toLocaleString()}</div>
            </div>
            <div>
              <div className="intel-label">LAST ACTIVITY</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                {new Date(c.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
              </div>
            </div>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
        ))}
      </div>

      {/* Create Case Modal */}
      {showCreate && <CreateCaseModal onClose={() => setSearchParams({ tab })} />}
    </div>
  );
};

export default CasesPage;
