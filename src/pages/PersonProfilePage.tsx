// ============================================================
// NEXUS — Person Profile Page
// Detailed intelligence profile
// ============================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Network } from 'lucide-react';
import { persons } from '../data/persons';
import { evidenceRecords } from '../data/evidence';
import { graphRelationships, getRelationshipsForNode } from '../data/graphRelationships';
import { graphNodes } from '../data/graphNodes';

const PersonProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const person = persons.find((p) => p.id === id);

  if (!person) return (
    <div style={{ padding: '24px' }}>
      <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Person not found: {id}</div>
    </div>
  );

  const evidence = evidenceRecords.filter((e) => e.relatedPersonIds.includes(person.id));
  const relationships = graphRelationships.filter((r) => r.source === person.id || r.target === person.id);

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <button className="btn btn--ghost" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
        <ArrowLeft size={12} /> BACK
      </button>

      {/* Profile header */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderLeft: '2px solid var(--accent-dim)' }}>
        <div style={{ width: '60px', height: '60px', border: '1px solid var(--border-base)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--accent)' }}>
            {person.name.split(' ').map((n) => n[0]).join('')}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 400 }}>{person.name}</h1>
            <span className={`badge badge--${person.status === 'ACTIVE' ? 'active' : 'closed'}`}>{person.status}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {person.aliases.join(' · ')}
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {[
              { label: 'INVESTIGATION PRIORITY', value: `${person.investigationPriority}/100`, accent: true },
              { label: 'NETWORK CONNECTIONS', value: person.connectionCount },
              { label: 'EVIDENCE RECORDS', value: person.evidenceCount },
              { label: 'NETWORK CENTRALITY', value: person.networkCentrality.toFixed(2) },
            ].map(({ label, value, accent }) => (
              <div key={label}>
                <div className="data-key">{label}</div>
                <div className="data-value" style={{ fontSize: '0.9rem', color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button className="btn btn--accent" onClick={() => navigate(`/network?center=${person.id}`)}>
            <Network size={11} /> VIEW NETWORK
          </button>
          <button className="btn btn--ghost" onClick={() => navigate(`/investigations/known-suspect`)}>
            INVESTIGATE
          </button>
        </div>
      </div>

      {/* Identity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px' }}>
          <div className="section-header" style={{ marginBottom: '12px' }}>IDENTITY</div>
          {[
            { label: 'Full Name',     value: person.name },
            { label: 'Aliases',       value: person.aliases.join(', ') || '—' },
            { label: 'Occupation',    value: person.occupation || '—' },
            { label: 'Nationality',   value: person.nationality || '—' },
            { label: 'Age',           value: person.age ? `${person.age} years` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-faint)' }}>
              <span className="data-key">{label.toUpperCase()}</span>
              <span className="data-value" style={{ fontSize: '0.72rem' }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px' }}>
          <div className="section-header" style={{ marginBottom: '12px' }}>EVIDENCE BREAKDOWN</div>
          {[
            { label: 'CDR Records',          value: person.cdrRecords },
            { label: 'Financial Records',    value: person.financialRecords },
            { label: 'Surveillance Reports', value: person.surveillanceReports },
            { label: 'Wiretap References',   value: person.wiretapReferences },
            { label: 'Intelligence Reports', value: person.intelligenceReports },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-faint)' }}>
              <span className="data-key">{label.toUpperCase()}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="progress-track" style={{ width: '40px' }}>
                  <div className="progress-fill" style={{ width: `${Math.min(100, value * 10)}%` }} />
                </div>
                <span className="data-value" style={{ fontSize: '0.7rem' }}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network connections */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px', marginBottom: '16px' }}>
        <div className="section-header" style={{ marginBottom: '12px' }}>NETWORK CONNECTIONS ({relationships.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {relationships.slice(0, 8).map((rel) => {
            const otherId = rel.source === person.id ? rel.target as string : rel.source as string;
            const otherNode = graphNodes.find((n) => n.id === otherId);
            return (
              <div key={rel.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0', borderBottom: '1px solid var(--border-faint)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--accent)', minWidth: '160px', letterSpacing: '0.06em' }}>{rel.type}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{otherNode?.displayName || otherId}</span>
                <span className="intel-label" style={{ marginLeft: 'auto' }}>{Math.round((rel.properties.confidence || 0) * 100)}% confidence</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{rel.properties.evidenceCount} evidence</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Investigation indicators */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px', marginBottom: '16px' }}>
        <div className="section-header" style={{ marginBottom: '4px' }}>INDICATORS REQUIRING INVESTIGATOR REVIEW</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.1em' }}>
          AI-GENERATED — SYNTHETIC DEMONSTRATION — REQUIRES HUMAN VERIFICATION
        </div>
        {[
          'Direct communication with known suspects',
          'Financial relationships across flagged accounts',
          'Repeated co-location with persons of interest',
          'Appears in multiple evidence source types',
          'High network centrality score',
        ].map((indicator) => (
          <div key={indicator} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid var(--border-faint)' }}>
            <div style={{ width: '4px', height: '4px', background: 'var(--accent)', borderRadius: '50%', flexShrink: 0 }} />
            <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{indicator}</span>
          </div>
        ))}
      </div>

      {/* Notes */}
      {person.notes && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px' }}>
          <div className="section-header" style={{ marginBottom: '8px' }}>CASE NOTES</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{person.notes}</p>
        </div>
      )}
    </div>
  );
};

export default PersonProfilePage;
