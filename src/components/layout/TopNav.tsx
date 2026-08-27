// ============================================================
// NEXUS — Top Navigation Bar
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, User, ChevronDown, Shield, Zap, Database
} from 'lucide-react';

const alerts: any[] = [];

interface TopNavProps {
  onToggleSidebar: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');
  const highAlerts = activeAlerts.filter((a) => a.severity === 'HIGH');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

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
          gap: '16px',
          flexShrink: 0,
          zIndex: 100,
          position: 'relative',
        }}
      >
        {/* Sidebar toggle + Logo */}
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          {[0,1,2].map((i) => (
            <span
              key={i}
              style={{
                display: 'block',
                width: '14px',
                height: '1px',
                background: 'var(--text-muted)',
              }}
            />
          ))}
        </button>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              border: '1.5px solid var(--accent-dim)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '1px solid var(--accent)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: '4px', height: '4px', background: 'var(--accent)', borderRadius: '50%' }} />
            </div>
            {/* Connecting lines on circle */}
            <div style={{ position: 'absolute', top: '50%', left: '-4px', width: '3px', height: '1px', background: 'var(--accent-dim)' }} />
            <div style={{ position: 'absolute', top: '50%', right: '-4px', width: '3px', height: '1px', background: 'var(--accent-dim)' }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '0.12em',
                lineHeight: 1.1,
              }}
            >
              NEXUS
            </div>
            <div className="intel-label" style={{ fontSize: '0.5rem', letterSpacing: '0.18em' }}>
              CRIMINAL NETWORK INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Classification label */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            letterSpacing: '0.15em',
            color: 'var(--text-faint)',
            borderLeft: '1px solid var(--border-dim)',
            paddingLeft: '12px',
          }}
          className="hide-mobile"
        >
          AUTHORIZED ACCESS // DEMONSTRATION
        </div>

        <div style={{ flex: 1 }} />

        {/* System Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            border: '1px solid var(--border-dim)',
            background: 'var(--bg-void)',
          }}
          className="hide-mobile"
        >
          <div className="status-dot status-dot--operational" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            SYSTEM OPERATIONAL
          </span>
        </div>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          style={{
            background: 'var(--bg-void)',
            border: '1px solid var(--border-base)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em',
          }}
        >
          <Search size={12} />
          <span className="hide-mobile">SEARCH INTELLIGENCE</span>
        </button>

        {/* Active Case indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            border: '1px solid var(--accent-soft)',
            background: 'var(--accent-faint)',
            cursor: 'pointer',
          }}
          className="hide-mobile"
          onClick={() => navigate('/cases/CASE-2026-014')}
        >
          <Zap size={10} style={{ color: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>
            CASE-2026-014 ACTIVE
          </span>
        </div>

        {/* Notifications */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '5px',
            display: 'flex',
          }}
        >
          <Bell size={14} />
          {highAlerts.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '6px',
                height: '6px',
                background: 'var(--critical)',
                borderRadius: '50%',
              }}
              className="animate-pulse-accent"
            />
          )}
        </button>

        {/* User */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: '4px 8px',
            border: '1px solid var(--border-dim)',
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-base)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={11} style={{ color: 'var(--text-muted)' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.08em' }} className="hide-mobile">
            ACP KRISHNAN
          </span>
          <ChevronDown size={10} style={{ color: 'var(--text-muted)' }} className="hide-mobile" />
        </div>
      </nav>

      {/* Search Overlay */}
      {searchOpen && (
        <div
          className="modal-overlay"
          onClick={() => setSearchOpen(false)}
          style={{ alignItems: 'flex-start', paddingTop: '80px' }}
        >
          <div
            style={{
              width: '600px',
              maxWidth: '90vw',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-accent)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-dim)' }}>
              <div className="section-header" style={{ marginBottom: '12px' }}>INTELLIGENCE SEARCH</div>
              <form onSubmit={handleSearch}>
                <input
                  className="intel-input"
                  style={{ width: '100%' }}
                  placeholder="Search persons, cases, evidence IDs, organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </form>
            </div>
            <div style={{ padding: '12px 16px' }}>
              {['Person', 'Case', 'Evidence', 'Organization'].map((cat) => (
                <div key={cat} style={{ marginBottom: '8px' }}>
                  <div className="intel-label" style={{ marginBottom: '4px' }}>{cat}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', padding: '6px 0' }}>
                    Enter a search term to find {cat.toLowerCase()} records
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between' }}>
              <span className="intel-label">ESC to close</span>
              <span className="intel-label">ENTER to search</span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div
          style={{
            position: 'fixed',
            top: '50px',
            right: '60px',
            width: '320px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-accent)',
            zIndex: 200,
            maxHeight: '400px',
            overflowY: 'auto',
          }}
          onClick={() => setShowNotifications(false)}
        >
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="section-header">INTELLIGENCE ALERTS</span>
            <span className="intel-label">{activeAlerts.length} ACTIVE</span>
          </div>
          {activeAlerts.slice(0, 6).map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-faint)',
                cursor: 'pointer',
              }}
              onClick={() => { navigate('/alerts'); setShowNotifications(false); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span
                  style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
                  className={alert.severity === 'HIGH' ? 'priority-high' : alert.severity === 'MEDIUM' ? 'priority-medium' : ''}
                >
                  {alert.severity}
                </span>
                <span className="intel-label">{alert.category}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{alert.title}</div>
            </div>
          ))}
          <div style={{ padding: '8px 14px' }}>
            <button className="btn btn--ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { navigate('/alerts'); setShowNotifications(false); }}>
              VIEW ALL ALERTS
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNav;
