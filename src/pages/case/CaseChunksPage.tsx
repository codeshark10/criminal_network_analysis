// ============================================================
// NEXUS — Case Chunks Page
// Displays all extracted chunks for a case with filters
// ============================================================

import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, X, Filter } from 'lucide-react';
import { getCaseById } from '../../data/cases';
import { getChunksByCase } from '../../data/caseChunks';
import type { ChunkCategory, ExtractedChunk } from '../../types';

const categoryColors: Record<string, string> = {
  FIR: '#C07070',
  CDR: '#7090C0',
  FINANCIAL: '#C9B86A',
  SURVEILLANCE: '#80B060',
  INTELLIGENCE: '#B08060',
  CRIMINAL_HISTORY: '#9070B0',
  SOCIAL_INTELLIGENCE: '#60A0A0',
};

const ChunkDetail: React.FC<{ chunk: ExtractedChunk; onClose: () => void }> = ({ chunk, onClose }) => (
  <div style={{
    width: '380px', flexShrink: 0, background: 'var(--bg-panel)',
    borderLeft: '1px solid var(--border-base)', padding: '18px', overflowY: 'auto',
    animation: 'slide-in-right 0.25s ease-out',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div>
        <div className="section-header">CHUNK DETAIL</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {chunk.id}
        </div>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
        <X size={14} />
      </button>
    </div>

    {/* Category */}
    <div style={{ marginBottom: '14px' }}>
      <div className="intel-label" style={{ marginBottom: '6px' }}>CATEGORY</div>
      <span
        className={`category-pill category-pill--${chunk.category.toLowerCase()}`}
        style={{ color: categoryColors[chunk.category] || 'var(--accent)' }}
      >
        {chunk.category.replace(/_/g, ' ')}
      </span>
    </div>

    {/* Confidence */}
    <div style={{ marginBottom: '14px' }}>
      <div className="intel-label" style={{ marginBottom: '6px' }}>CONFIDENCE</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1, height: '4px', background: 'var(--border-dim)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${chunk.confidence}%`, background: chunk.confidence >= 90 ? '#6A9E6A' : chunk.confidence >= 70 ? 'var(--accent)' : 'var(--warning)' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          {chunk.confidence}%
        </span>
      </div>
    </div>

    {/* Divider */}
    <div className="divider" style={{ marginBottom: '14px' }} />

    {/* Extracted text */}
    <div style={{ marginBottom: '14px' }}>
      <div className="intel-label" style={{ marginBottom: '6px' }}>EXTRACTED TEXT</div>
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--text-secondary)',
        lineHeight: 1.7, padding: '12px', background: 'var(--bg-elevated)',
        border: '1px solid var(--border-base)', borderLeft: `3px solid ${categoryColors[chunk.category] || 'var(--accent)'}`,
      }}>
        "{chunk.text}"
      </div>
    </div>

    {/* Entities */}
    {chunk.entities && chunk.entities.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <div className="intel-label" style={{ marginBottom: '8px' }}>EXTRACTED ENTITIES</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {chunk.entities.map((ent) => (
            <span key={ent} style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.65rem', padding: '2px 8px',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-base)',
              color: 'var(--text-secondary)',
            }}>{ent}</span>
          ))}
        </div>
      </div>
    )}

    {/* Relationships */}
    {chunk.relationships && chunk.relationships.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <div className="intel-label" style={{ marginBottom: '8px' }}>EXTRACTED RELATIONSHIPS</div>
        {chunk.relationships.map((rel, i) => (
          <div key={i} style={{ padding: '7px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-base)', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-primary)' }}>{rel.from}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--accent-dim)', margin: '0 6px' }}>→ {rel.type} →</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-primary)' }}>{rel.to}</span>
          </div>
        ))}
      </div>
    )}

    {/* Traceability */}
    <div className="divider" style={{ marginBottom: '14px' }} />
    <div>
      <div className="intel-label" style={{ marginBottom: '8px' }}>TRACEABILITY</div>
      {[
        { label: 'Document', value: chunk.documentId },
        { label: 'Case', value: chunk.caseId },
        { label: 'Chunk Index', value: `#${chunk.index}` },
        { label: 'Extracted', value: new Date(chunk.createdAt).toLocaleDateString('en-IN') },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-faint)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--text-muted)' }}>{label}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{value}</span>
        </div>
      ))}
    </div>
  </div>
);

const CaseChunksPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChunk, setSelectedChunk] = useState<ExtractedChunk | null>(null);

  const caseData = getCaseById(caseId ?? '');
  const allChunks = getChunksByCase(caseId ?? '');
  const selectedCat = searchParams.get('cat') ?? 'ALL';

  const categories: Array<{ key: string; label: string }> = [
    { key: 'ALL', label: 'ALL' },
    { key: 'FIR', label: 'FIR' },
    { key: 'CDR', label: 'CDR' },
    { key: 'FINANCIAL', label: 'FINANCIAL' },
    { key: 'SURVEILLANCE', label: 'SURVEILLANCE' },
    { key: 'INTELLIGENCE', label: 'INTELLIGENCE' },
    { key: 'CRIMINAL_HISTORY', label: 'CRIM. HISTORY' },
    { key: 'SOCIAL_INTELLIGENCE', label: 'SOCIAL INTEL.' },
  ];

  const filteredChunks = useMemo(() => {
    let result = allChunks;
    if (selectedCat !== 'ALL') {
      result = result.filter((c) => c.category === selectedCat);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.text.toLowerCase().includes(q) ||
        c.entities?.some((e) => e.toLowerCase().includes(q))
      );
    }
    return result;
  }, [allChunks, selectedCat, searchQuery]);

  if (!caseData) return null;
  const cc = caseData.chunkCounts;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main chunk list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '4px' }}>
            {caseId} // EXTRACTED CHUNKS
          </div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 300, color: 'var(--text-primary)' }}>
            Intelligence Chunks
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {allChunks.length} chunks extracted from {caseData.documentCount} document{caseData.documentCount !== 1 ? 's' : ''} · Click a chunk to view details and traceability
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="intel-input"
            style={{ width: '100%', paddingLeft: '32px' }}
            placeholder="Search chunk text, entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', marginBottom: '16px', flexWrap: 'wrap' }}>
          {categories.map(({ key, label }) => {
            const count = key === 'ALL' ? allChunks.length
              : key === 'FIR' ? (cc?.fir ?? 0)
              : key === 'CDR' ? (cc?.cdr ?? 0)
              : key === 'FINANCIAL' ? (cc?.financial ?? 0)
              : key === 'SURVEILLANCE' ? (cc?.surveillance ?? 0)
              : key === 'INTELLIGENCE' ? (cc?.intelligence ?? 0)
              : key === 'CRIMINAL_HISTORY' ? (cc?.criminalHistory ?? 0)
              : (cc?.socialIntelligence ?? 0);
            return (
              <button
                key={key}
                className={`intel-tab ${selectedCat === key ? 'intel-tab--active' : ''}`}
                onClick={() => setSearchParams(key !== 'ALL' ? { cat: key } : {})}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                {label}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', background: 'var(--bg-elevated)', padding: '1px 5px' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chunk list */}
        {filteredChunks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            {allChunks.length === 0
              ? 'NO CHUNKS EXTRACTED — UPLOAD A DOCUMENT TO BEGIN'
              : 'NO CHUNKS MATCH THE CURRENT FILTER'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {filteredChunks.map((chunk) => (
              <div
                key={chunk.id}
                className={`chunk-card ${selectedChunk?.id === chunk.id ? 'chunk-card--selected' : ''}`}
                onClick={() => setSelectedChunk(selectedChunk?.id === chunk.id ? null : chunk)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  {/* Category indicator */}
                  <div style={{
                    width: '3px', alignSelf: 'stretch', flexShrink: 0,
                    background: categoryColors[chunk.category] || 'var(--accent)',
                    opacity: 0.8,
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--accent-dim)', letterSpacing: '0.08em' }}>
                        {chunk.id.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                          color: categoryColors[chunk.category] || 'var(--accent)',
                          border: `1px solid ${categoryColors[chunk.category] || 'var(--accent)'}40`,
                          padding: '1px 6px',
                        }}
                      >
                        {chunk.category.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                        {chunk.confidence}% confidence
                      </span>
                    </div>

                    <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      "{chunk.text}"
                    </p>

                    {chunk.entities && chunk.entities.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {chunk.entities.slice(0, 4).map((ent) => (
                          <span key={ent} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-faint)', padding: '1px 5px' }}>
                            {ent}
                          </span>
                        ))}
                        {chunk.entities.length > 4 && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-faint)', padding: '1px 5px' }}>
                            +{chunk.entities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chunk detail panel */}
      {selectedChunk && (
        <ChunkDetail chunk={selectedChunk} onClose={() => setSelectedChunk(null)} />
      )}
    </div>
  );
};

export default CaseChunksPage;
