// ============================================================
// NEXUS — Investigations Hub Page
// Choose investigation mode
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, Brain } from 'lucide-react';

const InvestigationsPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div className="section-header">INVESTIGATION MODES</div>
        <h1 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 300 }}>Select Investigation Approach</h1>
        <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Choose an investigation mode based on the available intelligence and the objective of the inquiry.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '24px', cursor: 'pointer', transition: 'all 0.2s', borderLeft: '2px solid var(--accent-dim)' }}
          onClick={() => navigate('/investigations/known-suspect')}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-dim)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-dim)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Fingerprint size={18} style={{ color: 'var(--accent-dim)' }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-primary)' }}>KNOWN SUSPECT</div>
              <div className="intel-label">MODE 01 — EXPAND A KNOWN PERSON'S NETWORK</div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Start with a known person of interest and uncover connected individuals, organizations, locations and activities through systematic network expansion. Best used when a specific suspect has been identified.
          </p>
        </div>

        <div
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '24px', cursor: 'pointer', transition: 'all 0.2s', borderLeft: '2px solid var(--accent-dim)' }}
          onClick={() => navigate('/investigations/unknown-suspect')}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-dim)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-dim)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Brain size={18} style={{ color: 'var(--accent-dim)' }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-primary)' }}>UNKNOWN SUSPECT</div>
              <div className="intel-label">MODE 02 — IDENTIFY INVESTIGATION CANDIDATES</div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Analyze case intelligence to automatically prioritize persons requiring investigator review using graph analytics, pattern detection, and anomaly identification. Best used when the network structure needs to reveal key actors.
          </p>
        </div>
      </div>
      <div style={{ marginTop: '16px', padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
        ⚠ AI-assisted investigation tools — All results require investigator verification. Synthetic demonstration data only.
      </div>
    </div>
  );
};

export default InvestigationsPage;
