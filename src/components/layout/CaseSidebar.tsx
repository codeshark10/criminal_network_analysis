// ============================================================
// NEXUS — Case-Specific Sidebar
// Only shown inside an individual case workspace
// ============================================================

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  FileText,
  Network,
  Users,
  Shield,
  Clock,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  Fingerprint,
  Brain,
  ArrowLeftRight,
  FileSearch,
  Radio,
  CreditCard,
  Eye,
  BookOpen,
  Globe,
} from 'lucide-react';

interface CaseSidebarProps {
  collapsed: boolean;
  caseId: string;
  onSwitchCase: () => void;
}

const CaseSidebar: React.FC<CaseSidebarProps> = ({ collapsed, caseId, onSwitchCase }) => {
  const caseData = {
    id: caseId,
    name: caseId,
    status: 'ACTIVE',
    priority: 'HIGH'
  };
  const base = `/cases/${caseId}`;

  const dataItems = [
    { icon: FileSearch, label: 'Source Data',       path: `${base}/data` },
    { icon: FileText,   label: 'FIR',               path: `${base}/data?cat=FIR` },
    { icon: Radio,      label: 'CDR',               path: `${base}/data?cat=CDR` },
    { icon: CreditCard, label: 'Financial',          path: `${base}/data?cat=FINANCIAL` },
    { icon: Eye,        label: 'Surveillance',       path: `${base}/data?cat=SURVEILLANCE` },
    { icon: BookOpen,   label: 'Intelligence',       path: `${base}/data?cat=INTELLIGENCE` },
    { icon: Shield,     label: 'Criminal History',   path: `${base}/data?cat=CRIMINAL_HISTORY` },
    { icon: Globe,      label: 'Social Intelligence',path: `${base}/data?cat=SOCIAL_INTELLIGENCE` },
  ];

  const investigationItems = [
    { icon: Fingerprint,    label: 'Known Suspect',    path: `${base}/investigations/known-suspect` },
    { icon: Brain,          label: 'Unknown Suspect',  path: `${base}/investigations/unknown-suspect` },
    { icon: Network,        label: 'Network Analysis', path: `${base}/network` },
    { icon: Users,          label: 'Persons of Interest', path: `${base}/persons` },
    { icon: FileText,       label: 'Evidence',         path: `${base}/evidence` },
    { icon: Clock,          label: 'Timeline',         path: `${base}/timeline` },
    { icon: AlertTriangle,  label: 'Alerts',           path: `${base}/alerts` },
    { icon: BarChart3,      label: 'Analytics',        path: `${base}/analytics` },
  ];

  const priorityColor = caseData?.priority === 'CRITICAL' ? 'var(--critical)'
    : caseData?.priority === 'HIGH' ? 'var(--accent)'
    : caseData?.priority === 'MEDIUM' ? 'var(--accent-dim)'
    : 'var(--text-muted)';

  return (
    <aside
      style={{
        width: collapsed ? '48px' : '220px',
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
      {/* Case Context Banner */}
      {!collapsed && caseData && (
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--accent-soft)',
            background: 'var(--accent-faint)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '2px' }}>
            {caseData.id}
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '6px' }}>
            {caseData.name}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--operational)', letterSpacing: '0.08em' }}>
              {caseData.status}
            </span>
            <span style={{ color: 'var(--border-dim)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: priorityColor, letterSpacing: '0.08em' }}>
              {caseData.priority}
            </span>
          </div>
        </div>
      )}

      {/* Collapsed: just a status dot */}
      {collapsed && (
        <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border-faint)' }}>
          <div className="status-dot status-dot--operational animate-pulse-accent" />
        </div>
      )}

      {/* Overview link */}
      <NavLink
        to={`${base}/overview`}
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
        })}
      >
        {({ isActive }) => (
          <>
            <LayoutDashboard size={14} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
            {!collapsed && (
              <span style={{ fontSize: '0.78rem', color: isActive ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: isActive ? 500 : 400 }}>
                Case Overview
              </span>
            )}
          </>
        )}
      </NavLink>

      {/* Scrollable nav */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '4px 0' }}>
        {/* DATA section */}
        {!collapsed && (
          <div style={{ padding: '10px 12px 4px', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
            Data
          </div>
        )}
        {collapsed && <div style={{ height: '4px' }} />}

        {/* Source Data (link to chunks page) */}
        <NavLink
          to={`${base}/chunks`}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: collapsed ? '8px 0' : '7px 12px',
            textDecoration: 'none', justifyContent: collapsed ? 'center' : 'flex-start',
            borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            background: isActive ? 'var(--accent-faint)' : 'transparent',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          })}
        >
          {({ isActive }) => (
            <>
              <Database size={12} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
              {!collapsed && <span style={{ fontSize: '0.73rem', color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}>Extracted Chunks</span>}
            </>
          )}
        </NavLink>

        {/* Data category items (only in expanded mode) */}
        {!collapsed && dataItems.slice(1).map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '6px 12px 6px 20px',
              textDecoration: 'none',
              borderLeft: '2px solid transparent',
              background: isActive ? 'var(--accent-faint)' : 'transparent',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={11} style={{ color: isActive ? 'var(--accent-dim)' : 'var(--text-faint)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.7rem', color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* INVESTIGATION section */}
        {!collapsed && (
          <div style={{ padding: '10px 12px 4px', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', color: 'var(--text-faint)', textTransform: 'uppercase', marginTop: '4px' }}>
            Investigation
          </div>
        )}
        {collapsed && <div style={{ height: '8px' }} />}

        {investigationItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: collapsed ? '8px 0' : '7px 12px',
              textDecoration: 'none', justifyContent: collapsed ? 'center' : 'flex-start',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              background: isActive ? 'var(--accent-faint)' : 'transparent',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={12} style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                {!collapsed && <span style={{ fontSize: '0.73rem', color: isActive ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: isActive ? 500 : 400 }}>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Case switcher at bottom */}
      {!collapsed && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-faint)' }}>
          <button
            onClick={onSwitchCase}
            style={{
              width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-base)',
              color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              letterSpacing: '0.1em', padding: '7px 10px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget).style.borderColor = 'var(--accent-dim)'; (e.currentTarget).style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { (e.currentTarget).style.borderColor = 'var(--border-base)'; (e.currentTarget).style.color = 'var(--text-secondary)'; }}
          >
            <span>SWITCH CASE</span>
            <ArrowLeftRight size={10} />
          </button>
          <div style={{ marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--text-faint)', letterSpacing: '0.1em' }}>
            SIH26189 // NCRB // MHA
          </div>
        </div>
      )}
      {collapsed && (
        <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border-faint)' }}>
          <button
            onClick={onSwitchCase}
            title="Switch Case"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
          >
            <ArrowLeftRight size={12} />
          </button>
        </div>
      )}
    </aside>
  );
};

export default CaseSidebar;
