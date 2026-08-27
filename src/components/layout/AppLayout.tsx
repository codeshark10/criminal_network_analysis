// ============================================================
// NEXUS — Global App Layout (Homepage + Cases List)
// No case-specific sidebar on global pages
// ============================================================

import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Search, Bell, User, ChevronDown, X } from 'lucide-react';
import { alerts } from '../../data/alerts';
import { getGlobalStats } from '../../data/cases';

const GlobalTopNav: React.FC = () => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const stats = getGlobalStats();
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');
  const highAlerts = activeAlerts.filter((a) => a.severity === 'HIGH');

  return (
    <>
      <nav
        style={{
          height: '48px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-dim)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: '16px',
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', border: '1.5px solid var(--accent-dim)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ width: '16px', height: '16px', border: '1px solid var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '4px', height: '4px', background: 'var(--accent)', borderRadius: '50%' }} />
            </div>
            <div style={{ position: 'absolute', top: '50%', left: '-4px', width: '3px', height: '1px', background: 'var(--accent-dim)' }} />
            <div style={{ position: 'absolute', top: '50%', right: '-4px', width: '3px', height: '1px', background: 'var(--accent-dim)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.87rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.12em', lineHeight: 1.1 }}>
              NEXUS
            </div>
            <div className="intel-label" style={{ fontSize: '0.5rem', letterSpacing: '0.18em' }}>
              CRIMINAL NETWORK INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Global nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '8px' }} className="hide-mobile">
          {[
            { label: 'OVERVIEW',    path: '/' },
            { label: 'CASES',       path: '/cases' },
            { label: 'PERSONS',     path: '/persons' },
            { label: 'ALERTS',      path: '/alerts' },
            { label: 'ANALYTICS',   path: '/analytics' },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)',
                letterSpacing: '0.1em', padding: '6px 10px', transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget).style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { (e.currentTarget).style.color = 'var(--text-muted)'; }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Global stats strip */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '4px 12px', border: '1px solid var(--border-dim)', background: 'var(--bg-void)' }}
          className="hide-mobile"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div className="status-dot status-dot--operational animate-pulse-accent" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              {stats.active} ACTIVE CASES
            </span>
          </div>
          <span style={{ color: 'var(--border-dim)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            {stats.total} TOTAL
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Classification */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', color: 'var(--text-faint)' }} className="hide-mobile">
          AUTHORIZED // DEMONSTRATION
        </div>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          style={{ background: 'var(--bg-void)', border: '1px solid var(--border-base)', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
        >
          <Search size={12} />
          <span className="hide-mobile">SEARCH ALL CASES</span>
        </button>

        {/* Notifications */}
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
          <div style={{ width: '600px', maxWidth: '90vw', background: 'var(--bg-panel)', border: '1px solid var(--border-accent)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-dim)' }}>
              <div className="section-header" style={{ marginBottom: '12px' }}>GLOBAL INTELLIGENCE SEARCH</div>
              <input
                className="intel-input"
                style={{ width: '100%' }}
                placeholder="Search across all cases — persons, evidence, organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ padding: '12px 16px' }}>
              {['Persons', 'Cases', 'Evidence', 'Organizations'].map((cat) => (
                <div key={cat} style={{ marginBottom: '8px' }}>
                  <div className="intel-label" style={{ marginBottom: '4px' }}>{cat}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', padding: '6px 0' }}>
                    Enter a search term to find {cat.toLowerCase()} across all cases
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between' }}>
              <span className="intel-label">ESC TO CLOSE</span>
              <span className="intel-label">ENTER TO SEARCH</span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {showNotifications && (
        <div
          style={{ position: 'fixed', top: '50px', right: '60px', width: '320px', background: 'var(--bg-panel)', border: '1px solid var(--border-accent)', zIndex: 200, maxHeight: '400px', overflowY: 'auto' }}
          onClick={() => setShowNotifications(false)}
        >
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="section-header">INTELLIGENCE ALERTS</span>
            <span className="intel-label">{activeAlerts.length} ACTIVE</span>
          </div>
          {activeAlerts.slice(0, 6).map((alert) => (
            <div key={alert.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-faint)', cursor: 'pointer' }}
              onClick={() => { navigate('/alerts'); setShowNotifications(false); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }} className={alert.severity === 'HIGH' ? 'priority-high' : 'priority-medium'}>
                  {alert.severity}
                </span>
                <span className="intel-label">{alert.category}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{alert.title}</div>
            </div>
          ))}
          <div style={{ padding: '8px 14px' }}>
            <button className="btn btn--ghost" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { navigate('/alerts'); setShowNotifications(false); }}>
              VIEW ALL ALERTS
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ── Global App Layout (no sidebar) ────────────────────────────
const AppLayout: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
    <GlobalTopNav />
    <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-void)', position: 'relative' }}>
      <Outlet />
    </main>
  </div>
);

export default AppLayout;
