// ============================================================
// NEXUS — Investigation Modes Component
// Known Suspect + Unknown Suspect workflows
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, Brain, ArrowRight } from 'lucide-react';

const InvestigationModes: React.FC = () => {
  const navigate = useNavigate();

  const modes = [
    {
      key: 'known',
      icon: Fingerprint,
      badge: 'MODE 01',
      title: 'KNOWN SUSPECT',
      subtitle: 'EXPAND A KNOWN PERSON\'S NETWORK',
      description:
        'Start with a known person and uncover connected individuals, organizations, locations and activities through network expansion.',
      pipeline: ['Known Person', 'Connected Entities', 'Network Expansion', 'Relationship Analysis', 'Evidence Analysis', 'Investigation Candidates'],
      action: 'START INVESTIGATION',
      path: '/cases?create=true',
    },
    {
      key: 'unknown',
      icon: Brain,
      badge: 'MODE 02',
      title: 'UNKNOWN SUSPECT',
      subtitle: 'IDENTIFY INVESTIGATION CANDIDATES',
      description:
        'Analyze case intelligence to automatically prioritize persons requiring investigator review using graph analytics and pattern detection.',
      pipeline: ['Case Data', 'Entity Extraction', 'Knowledge Graph', 'Network Analysis', 'Candidate Detection', 'Investigator Review'],
      action: 'ANALYZE CASE',
      path: '/cases?create=true',
    },
  ];

  return (
    <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        return (
          <div
            key={mode.key}
            style={{
              flex: 1,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-base)',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Corner decoration */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderTop: '40px solid var(--bg-elevated)', borderLeft: '40px solid transparent' }} />
            </div>

            {/* Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Icon size={14} style={{ color: 'var(--accent-dim)' }} />
              <span className="intel-label" style={{ color: 'var(--accent-dim)', letterSpacing: '0.2em' }}>{mode.badge}</span>
            </div>

            {/* Title */}
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                fontWeight: 400,
                color: 'var(--text-primary)',
                letterSpacing: '0.08em',
                marginBottom: '4px',
              }}
            >
              {mode.title}
            </div>

            <div className="section-header" style={{ fontSize: '0.55rem', marginBottom: '12px' }}>
              {mode.subtitle}
            </div>

            {/* Description */}
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: '0 0 16px',
              }}
            >
              {mode.description}
            </p>

            {/* Pipeline */}
            <div style={{ marginBottom: '16px', marginTop: 'auto' }}>
              <div className="intel-label" style={{ marginBottom: '8px' }}>INVESTIGATION PIPELINE</div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                {mode.pipeline.map((step, i) => (
                  <React.Fragment key={step}>
                    <span
                      style={{
                        fontSize: '0.58rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-elevated)',
                        padding: '2px 6px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {step}
                    </span>
                    {i < mode.pipeline.length - 1 && (
                      <span style={{ color: 'var(--accent-dim)', fontSize: '0.6rem' }}>›</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="divider" style={{ marginBottom: '16px' }} />

            {/* CTA */}
            <button
              className="btn btn--accent"
              onClick={() => navigate(mode.path)}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 16px' }}
            >
              {mode.action}
              <ArrowRight size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default InvestigationModes;
