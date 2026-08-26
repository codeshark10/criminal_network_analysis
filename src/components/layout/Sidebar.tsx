// ============================================================
// NEXUS — Collapsible Intelligence Sidebar
// ============================================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Search,
  Network,
  Users,
  FileText,
  Clock,
  AlertTriangle,
  Database,
  BarChart3,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview',          path: '/' },
  { icon: FolderOpen,      label: 'Cases',             path: '/cases' },
  { icon: Search,          label: 'Investigations',    path: '/investigations' },
  { icon: Network,         label: 'Network Analysis',  path: '/network' },
  { icon: Users,           label: 'Persons of Interest', path: '/persons' },
  { icon: FileText,        label: 'Evidence Intelligence', path: '/evidence' },
  { icon: Clock,           label: 'Timeline',          path: '/timeline' },
  { icon: AlertTriangle,   label: 'Alerts',            path: '/alerts' },
  { icon: Database,        label: 'Data Sources',      path: '/data-sources' },
  { icon: BarChart3,       label: 'Analytics',         path: '/analytics' },
  { icon: Settings,        label: 'Settings',          path: '/settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  return (
    <aside
      style={{
        width: collapsed ? '48px' : '200px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-dim)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 0.25s ease',
        zIndex: 50,
      }}
    >
      {/* System status stripe */}
      <div
        style={{
          padding: collapsed ? '10px 0' : '10px 12px',
          borderBottom: '1px solid var(--border-faint)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div className="status-dot status-dot--operational animate-pulse-accent" />
        {!collapsed && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
            NEXUS // ONLINE
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: collapsed ? '10px 0' : '9px 12px',
              textDecoration: 'none',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              background: isActive ? 'var(--accent-faint)' : 'transparent',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={14}
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                />
                {!collapsed && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom info */}
      {!collapsed && (
        <div
          style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border-faint)',
          }}
        >
          <div className="intel-label" style={{ marginBottom: '4px' }}>SIH26189</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-faint)', lineHeight: 1.4 }}>
            NCRB // MHA
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
