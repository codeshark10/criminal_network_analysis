// ============================================================
// NEXUS — Case Data Page
// Shows source documents and chunk distribution for a case
// Now powered by frontend-processed document data
// ============================================================

import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, ChevronRight, ArrowRight } from 'lucide-react';
import { useCaseData } from '../../context/CaseDataContext';
import { computeChunkCounts } from '../../services/documentProcessor';

const CaseDataPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getChunks, getDocuments } = useCaseData();
  const selectedCat = searchParams.get('cat') ?? 'ALL';

  // Load real data from context
  const allChunks = caseId ? getChunks(caseId) : [];
  const docs = caseId ? getDocuments(caseId) : [];
  const cc = computeChunkCounts(allChunks);
  const total = cc.total;

  const base = `/cases/${caseId}`;

  const categories = [
    { key: 'ALL',                  label: 'ALL',             color: 'var(--accent)' },
    { key: 'FIR',                  label: 'FIR',             color: '#C07070' },
    { key: 'CDR',                  label: 'CDR',             color: '#7090C0' },
    { key: 'FINANCIAL',            label: 'FINANCIAL',       color: 'var(--accent)' },
    { key: 'SURVEILLANCE',         label: 'SURVEILLANCE',    color: '#80B060' },
    { key: 'INTELLIGENCE',         label: 'INTELLIGENCE',    color: '#B08060' },
    { key: 'CRIMINAL_HISTORY',     label: 'CRIM. HISTORY',   color: '#9070B0' },
    { key: 'SOCIAL_INTELLIGENCE',  label: 'SOCIAL INTEL.',   color: '#60A0A0' },
  ];

  const categoryData = [
    { key: 'FIR',                  label: 'First Information Report', value: cc.fir,              color: '#C07070' },
    { key: 'CDR',                  label: 'Call Detail Records',       value: cc.cdr,              color: '#7090C0' },
    { key: 'FINANCIAL',            label: 'Financial Intelligence',    value: cc.financial,        color: 'var(--accent)' },
    { key: 'SURVEILLANCE',         label: 'Surveillance Reports',      value: cc.surveillance,     color: '#80B060' },
    { key: 'INTELLIGENCE',         label: 'Intelligence Reports',      value: cc.intelligence,     color: '#B08060' },
    { key: 'CRIMINAL_HISTORY',     label: 'Criminal History',          value: cc.criminalHistory,  color: '#9070B0' },
    { key: 'SOCIAL_INTELLIGENCE',  label: 'Social Intelligence',       value: cc.socialIntelligence, color: '#60A0A0' },
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '4px' }}>
          {caseId} // SOURCE DATA
        </div>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 300, color: 'var(--text-primary)' }}>
          Investigation Data
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Source documents and extracted intelligence data for {caseId}
        </p>
      </div>

      {/* Category filter tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', marginBottom: '24px', flexWrap: 'wrap' }}>
        {categories.map(({ key, label }) => (
          <button
            key={key}
            className={`intel-tab ${selectedCat === key ? 'intel-tab--active' : ''}`}
            onClick={() => navigate(`${base}/data${key !== 'ALL' ? `?cat=${key}` : ''}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Documents section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div className="section-header">SOURCE DOCUMENTS</div>
          <button className="btn btn--accent" style={{ fontSize: '0.7rem' }} onClick={() => navigate('/cases?create=true')}>
            <FileText size={11} /> UPLOAD NEW DOCUMENT
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {docs.length === 0 ? (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '32px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginBottom: '12px' }}>
                NO DOCUMENTS UPLOADED FOR THIS CASE
              </div>
              <button className="btn btn--accent" onClick={() => navigate('/cases?create=true')}>
                UPLOAD INVESTIGATION DATA <ArrowRight size={12} />
              </button>
            </div>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
                  padding: '14px 16px', display: 'grid',
                  gridTemplateColumns: '1fr 100px 80px 100px 24px', gap: '12px',
                  alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s',
                }}
                onClick={() => navigate(`${base}/chunks`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={12} style={{ color: 'var(--accent-dim)' }} />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{doc.fileName}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Uploaded {new Date(doc.uploadedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <div>
                  <div className="intel-label" style={{ marginBottom: '2px' }}>CHUNKS</div>
                  <div className="data-value">{doc.chunkCount ?? 0}</div>
                </div>
                <div>
                  <div className="intel-label" style={{ marginBottom: '2px' }}>SIZE</div>
                  <div className="data-value">{(doc.size / 1024).toFixed(1)} KB</div>
                </div>
                <div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.6rem', padding: '2px 8px',
                    background: 'var(--operational-soft)',
                    border: '1px solid var(--operational)',
                    color: '#6A9E6A',
                  }}>
                    {doc.status}
                  </span>
                </div>
                <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Category distribution — only show when there are chunks */}
      {total > 0 && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="section-header">DATA EXTRACTION RESULTS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {total} TOTAL CHUNKS EXTRACTED
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '20px' }}>
            {categoryData.map(({ key, label, value, color }) => (
              <div
                key={key}
                onClick={() => navigate(`${base}/chunks?cat=${key}`)}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-base)',
                  borderLeft: `3px solid ${color}`, padding: '12px 14px',
                  cursor: 'pointer', transition: 'background 0.15s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 300, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-faint)', marginTop: '2px' }}>
                    {total > 0 ? Math.round((value / total) * 100) : 0}% of total
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ width: '40px', height: '40px', position: 'relative' }}>
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border-dim)" strokeWidth="3" />
                      <circle
                        cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3"
                        strokeDasharray={`${total > 0 ? (value / total) * 100.53 : 0} 100.53`}
                        strokeDashoffset="25" opacity="0.7"
                        transform="rotate(-90 20 20)"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn btn--ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.72rem' }}
            onClick={() => navigate(`${base}/chunks`)}
          >
            BROWSE ALL EXTRACTED CHUNKS <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Empty state for category distribution */}
      {total === 0 && docs.length === 0 && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '24px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
            UPLOAD A DOCUMENT TO SEE EXTRACTION RESULTS
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDataPage;
