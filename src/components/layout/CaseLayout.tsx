// ============================================================
// NEXUS — Case Layout
// Wraps individual case pages with case-specific navigation
// ============================================================

import React, { useState } from 'react';
import { Outlet, useParams, useNavigate, NavLink } from 'react-router-dom';
import { Search, Bell, User, ChevronDown, Shield, ArrowLeft, ChevronRight, X } from 'lucide-react';
import CaseSidebar from './CaseSidebar';
import { getCaseById, cases } from '../../data/cases';
import { alerts } from '../../data/alerts';

// ── Case Switcher Modal ────────────────────────────────────────
const CaseSwitcherModal: React.FC<{ currentCaseId: string; onClose: () => void }> = ({
  currentCaseId,
  onClose,
}) => {
  const navigate = useNavigate();
  const activeCases = cases.filter((c) => c.status === 'ACTIVE' || c.status === 'UNDER_REVIEW');
  const pastCases = cases.filter((c) => c.status === 'CLOSED' || c.status === 'ARCHIVED');

  const handleSelect = (caseId: string) => {
    navigate(`/cases/${caseId}/overview`);
    onClose();
  };

  const CaseRow: React.FC<{ c: typeof cases[0] }> = ({ c }) => (
    <div
      onClick={() => handleSelect(c.id)}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-faint)',
        cursor: 'pointer',
        background: c.id === currentCaseId ? 'var(--accent-faint)' : 'transparent',
        borderLeft: c.id === currentCaseId ? '2px solid var(--accent)' : '2px solid transparent',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { if (c.id !== currentCaseId) (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)'; }}
      onMouseLeave={(e) => { if (c.id !== currentCaseId) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: c.id === currentCaseId ? 'var(--accent)' : 'var(--accent-dim)', letterSpacing: '0.08em', marginBottom: '2px' }}>
          {c.id} {c.id === currentCaseId && '← CURRENT'}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.name}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <span className={`badge badge--${c.status === 'ACTIVE' ? 'active' : c.status === 'UNDER_REVIEW' ? 'review' : 'closed'}`}>
          {c.status.replace('_', ' ')}
        </span>
        <span className={`badge badge--${c.priority === 'CRITICAL' ? 'critical' : c.priority === 'HIGH' ? 'high' : 'medium'}`}>
          {c.priority}
        </span>
      </div>
      <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ width: '580px', maxWidth: '95vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="section-header">SWITCH INVESTIGATION CASE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Current: {currentCaseId}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', color: 'var(--text-faint)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-faint)' }}>
            Active & Under Review
          </div>
          {activeCases.map((c) => <CaseRow key={c.id} c={c} />)}

          <div style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.15em', color: 'var(--text-faint)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-faint)', borderTop: '1px solid var(--border-dim)', marginTop: '4px' }}>
            Past Cases
          </div>
          {pastCases.map((c) => <CaseRow key={c.id} c={c} />)}
        </div>

        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="intel-label">SELECT A CASE TO SWITCH WORKSPACE</span>
          <button className="btn btn--ghost" style={{ fontSize: '0.7rem' }} onClick={onClose}>CANCEL</button>
        </div>
      </div>
    </div>
  );
};

// ── Case Top Nav ───────────────────────────────────────────────
const CaseTopNav: React.FC<{
  caseId: string;
  onToggleSidebar: () => void;
  onSwitchCase: () => void;
}> = ({ caseId, onToggleSidebar, onSwitchCase }) => {
  const navigate = useNavigate();
  const caseData = getCaseById(caseId);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const caseAlerts = alerts.filter((a) => a.caseId === caseId && a.status === 'ACTIVE');
  const highAlerts = caseAlerts.filter((a) => a.severity === 'HIGH');

  const priorityColor = caseData?.priority === 'CRITICAL' ? 'var(--critical)'
    : caseData?.priority === 'HIGH' ? 'var(--accent)'
    : 'var(--accent-dim)';

  return (
    <>
      <nav
        style={{
          height: '48px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-dim)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '12px',
          flexShrink: 0,
          zIndex: 100,
          position: 'relative',
        }}
      >
        {/* Hamburger */}
        <button
          onClick={onToggleSidebar}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}
        >
          {[0,1,2].map((i) => (
            <span key={i} style={{ display: 'block', width: '14px', height: '1px', background: 'var(--text-muted)' }} />
          ))}
        </button>

        {/* Back to cases */}
        <button
          onClick={() => navigate('/cases')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em' }}
        >
          <ArrowLeft size={10} />
          <span className="hide-mobile">CASES</span>
        </button>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '22px', height: '22px', border: '1.5px solid var(--accent-dim)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '10px', height: '10px', border: '1px solid var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '3px', height: '3px', background: 'var(--accent)', borderRadius: '50%' }} />
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.1em' }}>NEXUS</span>
        </div>

        {/* Case context pill */}
        {caseData && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              background: 'var(--accent-faint)',
              border: `1px solid ${priorityColor}30`,
              borderLeft: `2px solid ${priorityColor}`,
              cursor: 'pointer',
            }}
            onClick={onSwitchCase}
            className="hide-mobile"
          >
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--accent)', letterSpacing: '0.1em', lineHeight: 1.2 }}>
                {caseData.id}
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.2 }}>
                {caseData.name}
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: priorityColor }}>
              {caseData.priority} ▾
            </span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Case search */}
        <button
          onClick={() => setSearchOpen(true)}
          style={{ background: 'var(--bg-void)', border: '1px solid var(--border-base)', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
        >
          <Search size={12} />
          <span className="hide-mobile">SEARCH {caseId}</span>
        </button>

        {/* Alerts */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          style={{ position: 'relative', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px' }}
        >
          <Bell size={14} />
          {highAlerts.length > 0 && (
            <span style={{ position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px', background: 'var(--critical)', borderRadius: '50%' }} className="animate-pulse-accent" />
          )}
        </button>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '4px 8px', border: '1px solid var(--border-dim)' }}>
          <div style={{ width: '22px', height: '22px', background: 'var(--bg-elevated)', border: '1px solid var(--border-base)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={11} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-secondary)', letterSpacing: '0.08em' }} className="hide-mobile">ACP KRISHNAN</span>
          <ChevronDown size={10} style={{ color: 'var(--text-muted)' }} className="hide-mobile" />
        </div>
      </nav>

      {/* Search overlay */}
      {searchOpen && (
        <div className="modal-overlay" onClick={() => setSearchOpen(false)} style={{ alignItems: 'flex-start', paddingTop: '80px' }}>
          <div style={{ width: '560px', maxWidth: '90vw', background: 'var(--bg-panel)', border: '1px solid var(--border-accent)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-dim)' }}>
              <div className="section-header" style={{ marginBottom: '8px' }}>SEARCH — {caseId}</div>
              <input
                className="intel-input"
                style={{ width: '100%' }}
                placeholder={`Search persons, evidence, chunks within ${caseId}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between' }}>
              <span className="intel-label">SEARCHING WITHIN {caseId}</span>
              <span className="intel-label">ESC TO CLOSE</span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {showNotifications && (
        <div
          style={{ position: 'fixed', top: '50px', right: '60px', width: '300px', background: 'var(--bg-panel)', border: '1px solid var(--border-accent)', zIndex: 200, maxHeight: '380px', overflowY: 'auto' }}
          onClick={() => setShowNotifications(false)}
        >
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="section-header">CASE ALERTS</span>
            <span className="intel-label">{caseAlerts.length} ACTIVE</span>
          </div>
          {caseAlerts.slice(0, 5).map((alert) => (
            <div key={alert.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-faint)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }} className={alert.severity === 'HIGH' ? 'priority-high' : 'priority-medium'}>
                  {alert.severity}
                </span>
                <span className="intel-label">{alert.category}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{alert.title}</div>
            </div>
          ))}
          {caseAlerts.length === 0 && (
            <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
              NO ACTIVE ALERTS FOR THIS CASE
            </div>
          )}
        </div>
      )}
    </>
  );
};

// ── Case Layout ────────────────────────────────────────────────
const CaseLayout: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);

  if (!caseId) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <CaseTopNav
        caseId={caseId}
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        onSwitchCase={() => setShowSwitcher(true)}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <CaseSidebar
          collapsed={sidebarCollapsed}
          caseId={caseId}
          onSwitchCase={() => setShowSwitcher(true)}
        />
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-void)', position: 'relative' }}>
          <Outlet />
        </main>
      </div>

      {showSwitcher && (
        <CaseSwitcherModal
          currentCaseId={caseId}
          onClose={() => setShowSwitcher(false)}
        />
      )}
    </div>
  );
};

export default CaseLayout;
