// ============================================================
// NEXUS — Homepage / Intelligence Dashboard
// SIH26189 | AI-Powered Criminal Network Analysis System
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, Network, Database,
  AlertTriangle, BarChart3, Activity,
} from 'lucide-react';
import CasesCircle from '../components/home/CasesCircle';
import FloatingModule from '../components/home/FloatingModule';
import InvestigationModes from '../components/home/InvestigationModes';
import { getActiveCases, getPastCases } from '../data/cases';
import { persons } from '../data/persons';
import { evidenceRecords } from '../data/evidence';
import { alerts } from '../data/alerts';
import { networkMetrics, dataSources } from '../data/alerts';

// Mini bar chart component for modules
const MiniBarChart: React.FC<{ bars: number[] }> = ({ bars }) => {
  const max = Math.max(...bars);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '24px' }}>
      {bars.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i === bars.length - 1 ? 'var(--accent)' : 'var(--border-base)',
            height: `${(v / max) * 100}%`,
            minHeight: '2px',
            transition: 'height 0.3s',
          }}
        />
      ))}
    </div>
  );
};

// Mini network viz for Networks module
const MiniNetworkViz: React.FC = () => (
  <svg width="100%" height="28" viewBox="0 0 130 28">
    {/* Nodes */}
    {[[20,14],[65,6],[65,22],[110,14],[40,6],[90,6]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r={i===0||i===3?4:2.5}
        fill="none" stroke={i===0||i===3?"rgba(201,184,106,0.6)":"rgba(201,184,106,0.25)"} strokeWidth="0.8" />
    ))}
    {/* Edges */}
    {[[20,14,65,6],[20,14,65,22],[65,6,110,14],[65,22,110,14],[20,14,40,6],[65,6,90,6]].map(([x1,y1,x2,y2],i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(201,184,106,0.12)" strokeWidth="0.8" />
    ))}
  </svg>
);

// CCTV frame overlay component
const CCTVOverlay: React.FC = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      right: '16px',
      width: '160px',
      height: '120px',
      border: '1px solid var(--border-dim)',
      background: 'var(--bg-surface)',
      overflow: 'hidden',
    }}>
      {/* Scanlines */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 4px)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* Static noise pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 30% 40%, rgba(201,184,106,0.03) 0%, transparent 60%)',
      }} />

      {/* Corner brackets */}
      {[{top:4,left:4},{top:4,right:4},{bottom:4,left:4},{bottom:4,right:4}].map((pos,i)=>(
        <div key={i} style={{
          position:'absolute', ...pos,
          width:'8px', height:'8px',
          borderTop: i < 2 ? '1px solid rgba(201,184,106,0.4)' : undefined,
          borderBottom: i >= 2 ? '1px solid rgba(201,184,106,0.4)' : undefined,
          borderLeft: i%2===0 ? '1px solid rgba(201,184,106,0.4)' : undefined,
          borderRight: i%2===1 ? '1px solid rgba(201,184,106,0.4)' : undefined,
        }} />
      ))}

      {/* REC indicator */}
      <div style={{ position:'absolute', top:6, left:8, display:'flex', alignItems:'center', gap:4, zIndex:3 }}>
        <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--critical)' }} className="animate-pulse-accent" />
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.45rem', color:'rgba(201,184,106,0.6)', letterSpacing:'0.15em' }}>REC</span>
      </div>

      {/* Timestamp */}
      <div style={{ position:'absolute', bottom:4, left:0, right:0, padding:'2px 6px', zIndex:3 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.45rem', color:'rgba(201,184,106,0.5)', letterSpacing:'0.1em' }}>
          {time}
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.4rem', color:'rgba(162,149,90,0.35)', letterSpacing:'0.08em' }}>
          CAM-042 // SECTOR-07
        </div>
      </div>

      {/* Crosshair center */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:3 }}>
        <div style={{ width:16, height:16, position:'relative' }}>
          <div style={{ position:'absolute', top:'50%', left:0, right:0, height:'0.5px', background:'rgba(201,184,106,0.2)' }} />
          <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:'0.5px', background:'rgba(201,184,106,0.2)' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:4, height:4, border:'0.5px solid rgba(201,184,106,0.3)', borderRadius:'50%' }} />
        </div>
      </div>
    </div>
  );
};

// Fingerprint background element
const FingerprintBg: React.FC<{ x: number | string; y: number | string; size?: number | string; opacity?: number }> = ({ x, y, size = 60, opacity = 0.03 }) => (
  <svg
    style={{ position:'absolute', left:x, top:y, pointerEvents:'none' }}
    width={size} height={size} viewBox="0 0 100 100" opacity={opacity}
  >
    {[10,20,30,40,50].map((r,i) => (
      <circle key={i} cx="50" cy="50" r={r}
        fill="none" stroke="rgba(201,184,106,1)"
        strokeWidth="1.5"
        strokeDasharray={i%2===0 ? "8 4" : "12 6"}
      />
    ))}
    <circle cx="50" cy="50" r="4" fill="rgba(201,184,106,0.3)" />
  </svg>
);

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<SVGSVGElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const activeCases = getActiveCases();
  const pastCases = getPastCases();

  const activePersons = persons.filter((p) => p.status === 'ACTIVE').length;
  const underReview = persons.filter((p) => p.status === 'UNDER_REVIEW').length;
  const archivedPersons = persons.filter((p) => p.status === 'ARCHIVED').length;

  const processedEvidence = evidenceRecords.filter((e) => e.status === 'PROCESSED').length;
  const pendingEvidence = evidenceRecords.filter((e) => e.status === 'PENDING').length;
  const flaggedEvidence = evidenceRecords.filter((e) => e.flagged).length;

  const highAlerts = alerts.filter((a) => a.severity === 'HIGH' && a.status === 'ACTIVE').length;
  const medAlerts = alerts.filter((a) => a.severity === 'MEDIUM' && a.status === 'ACTIVE').length;
  const lowAlerts = alerts.filter((a) => a.severity === 'LOW' && a.status === 'ACTIVE').length;

  // Container size for SVG connections
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Background micro-labels
  const microLabels = [
    { text: 'CASE DATABASE // ACTIVE', x: '5%', y: '8%' },
    { text: 'NODE STATUS: ONLINE', x: '80%', y: '12%' },
    { text: 'INTELLIGENCE CORE', x: '3%', y: '55%' },
    { text: 'DATA LINK: SECURE', x: '85%', y: '55%' },
    { text: 'ANALYSIS ENGINE: READY', x: '5%', y: '90%' },
    { text: 'EVIDENCE INDEX: 8,742', x: '75%', y: '88%' },
    { text: 'ENTITY RESOLUTION: ACTIVE', x: '40%', y: '5%' },
    { text: 'NETWORK STATUS: MAPPED', x: '40%', y: '92%' },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-void)',
      }}
    >
      {/* ── Background Grid ── */}
      <div className="intel-grid" />

      {/* ── Scanning line ── */}
      <div className="scan-line" />
      <div className="scan-line" style={{ animationDelay: '4s', animationDuration: '12s' }} />

      {/* ── Background micro-labels ── */}
      {microLabels.map((ml, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: ml.x,
            top: ml.y,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.45rem',
            letterSpacing: '0.18em',
            color: 'var(--text-faint)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {ml.text}
        </div>
      ))}

      {/* ── Fingerprint decorations ── */}
      <FingerprintBg x={-20} y={100} size={120} opacity={0.025} />
      <FingerprintBg x={-10} y={400} size={80} opacity={0.018} />
      <FingerprintBg x="90%" y={80} size={100} opacity={0.022} />
      <FingerprintBg x="88%" y={450} size={70} opacity={0.015} />

      {/* ── CCTV Overlay ── */}
      <CCTVOverlay />

      {/* ── Disclaimer banner ── */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-dim)',
          padding: '4px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.5rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          whiteSpace: 'nowrap',
          zIndex: 10,
        }}
      >
        ⚠ SYNTHETIC DEMONSTRATION DATA — AI insights require investigator verification
      </div>

      {/* ── Main Layout ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '50px 20px 30px',
          minHeight: '100%',
          gap: '32px',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* ── Central Intelligence Hub ── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '420px',
          }}
        >
          {/* SVG connecting lines */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                <polygon points="0 0, 4 2, 0 4" fill="rgba(201,184,106,0.2)" />
              </marker>
            </defs>
            {/* Lines from center to module positions */}
            {/* These are approximate — modules are positioned absolutely relative to this container */}
            {[
              { x1: '50%', y1: '50%', x2: '12%',  y2: '20%' }, // Persons top-left
              { x1: '50%', y1: '50%', x2: '12%',  y2: '80%' }, // Networks bottom-left
              { x1: '50%', y1: '50%', x2: '88%',  y2: '20%' }, // Evidence top-right
              { x1: '50%', y1: '50%', x2: '88%',  y2: '80%' }, // Alerts bottom-right
              { x1: '50%', y1: '50%', x2: '20%',  y2: '50%' }, // Data Sources left
              { x1: '50%', y1: '50%', x2: '80%',  y2: '50%' }, // Analytics right
            ].map((line, i) => (
              <line
                key={i}
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke="rgba(201,184,106,0.08)"
                strokeWidth="1"
                strokeDasharray="6 8"
              />
            ))}
          </svg>

          {/* Central CASES Circle */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <CasesCircle activeCount={activeCases.length} pastCount={pastCases.length} />
          </div>

          {/* ── Floating Modules — positioned around circle ── */}

          {/* MODULE 1: PERSONS — top-left */}
          <FloatingModule
            id="persons"
            title="PERSONS"
            value={persons.length}
            subtitle="Persons of Interest"
            icon={Users}
            items={[
              { label: 'Active',       value: activePersons },
              { label: 'Under Review', value: underReview },
              { label: 'Archived',     value: archivedPersons },
            ]}
            path="/persons"
            animationDelay={0}
            style={{ top: '10%', left: 'calc(50% - 340px)' }}
          />

          {/* MODULE 2: EVIDENCE — top-right */}
          <FloatingModule
            id="evidence"
            title="EVIDENCE"
            value={8742}
            subtitle="Evidence Records"
            icon={FileText}
            items={[
              { label: 'Processed', value: 7981 },
              { label: 'Pending',   value: 524 },
              { label: 'Flagged',   value: flaggedEvidence },
            ]}
            miniViz={<MiniBarChart bars={[42,58,61,87,78,94,66,81]} />}
            path="/evidence"
            animationDelay={1}
            style={{ top: '10%', right: 'calc(50% - 340px)' }}
          />

          {/* MODULE 3: NETWORKS — left middle */}
          <FloatingModule
            id="networks"
            title="NETWORKS"
            value={networkMetrics.communityCount}
            subtitle="Detected Networks"
            icon={Network}
            items={[
              { label: 'Active Clusters', value: 14 },
              { label: 'Bridge Nodes',    value: networkMetrics.bridgeNodes },
              { label: 'Max Centrality',  value: networkMetrics.maxCentrality.toFixed(2) },
            ]}
            miniViz={<MiniNetworkViz />}
            path="/network"
            animationDelay={2}
            style={{ top: '45%', left: 'calc(50% - 400px)', transform: 'translateY(-50%)' }}
          />

          {/* MODULE 4: ALERTS — right middle */}
          <FloatingModule
            id="alerts"
            title="ALERTS"
            value={alerts.filter((a) => a.status === 'ACTIVE').length}
            subtitle="Active Intelligence Alerts"
            icon={AlertTriangle}
            items={[
              { label: 'High Priority', value: highAlerts },
              { label: 'Medium',        value: medAlerts },
              { label: 'Low',           value: lowAlerts },
            ]}
            path="/alerts"
            animationDelay={3}
            style={{ top: '45%', right: 'calc(50% - 400px)', transform: 'translateY(-50%)' }}
          />

          {/* MODULE 5: DATA SOURCES — bottom-left */}
          <FloatingModule
            id="data-sources"
            title="DATA SOURCES"
            value={String(dataSources.length).padStart(2, '0')}
            subtitle="Connected Intel. Sources"
            icon={Database}
            items={[
              { label: 'FIR / Police', value: 'ONLINE' },
              { label: 'CDR',          value: 'ONLINE' },
              { label: 'Financial',    value: 'ONLINE' },
              { label: 'Surveillance', value: 'ONLINE' },
            ]}
            path="/data-sources"
            animationDelay={4}
            style={{ bottom: '10%', left: 'calc(50% - 340px)' }}
          />

          {/* MODULE 6: ANALYTICS — bottom-right */}
          <FloatingModule
            id="analytics"
            title="ANALYTICS"
            value={63}
            subtitle="Detected Anomalies"
            icon={BarChart3}
            items={[
              { label: 'Network Density', value: networkMetrics.density.toFixed(3) },
              { label: 'Avg Degree',      value: networkMetrics.avgDegree.toFixed(1) },
              { label: 'Communities',     value: networkMetrics.communityCount },
            ]}
            miniViz={<MiniBarChart bars={[20,35,28,52,44,63,57,70]} />}
            path="/analytics"
            animationDelay={5}
            style={{ bottom: '10%', right: 'calc(50% - 340px)' }}
          />
        </div>

        {/* ── System Status Strip ── */}
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            display: 'flex',
            gap: '1px',
          }}
        >
          {[
            { label: 'ANALYSIS ENGINE', value: 'READY',       ok: true },
            { label: 'DATA PIPELINE',   value: 'ACTIVE',      ok: true },
            { label: 'GRAPH DATABASE',  value: 'ONLINE',      ok: true },
            { label: 'NLP PROCESSOR',   value: 'STANDBY',     ok: true },
            { label: 'ENTITY INDEX',    value: '687 NODES',   ok: true },
            { label: 'EVIDENCE INDEX',  value: '8,742',       ok: true },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                flex: 1,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                padding: '8px 10px',
              }}
            >
              <div className="intel-label" style={{ marginBottom: '2px' }}>{item.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div className={`status-dot ${item.ok ? 'status-dot--operational' : 'status-dot--critical'}`} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Active Cases Strip ── */}
        <div style={{ width: '100%', maxWidth: '900px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div className="section-header">ACTIVE INVESTIGATIONS</div>
            <button className="btn btn--ghost" onClick={() => navigate('/cases')}>
              VIEW ALL
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {activeCases.slice(0, 3).map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-dim)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  borderLeft: '2px solid var(--accent-dim)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
              >
                <div style={{ minWidth: '120px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent)', letterSpacing: '0.08em' }}>{c.id}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</div>
                </div>
                <span className={`badge badge--${c.priority === 'CRITICAL' ? 'critical' : c.priority === 'HIGH' ? 'high' : 'medium'}`}>{c.priority}</span>
                <span className="badge badge--active">{c.status}</span>
                <div style={{ flex: 1, display: 'flex', gap: '16px' }} className="hide-mobile">
                  <div>
                    <div className="intel-label">PERSONS</div>
                    <div className="data-value">{c.personsOfInterestCount}</div>
                  </div>
                  <div>
                    <div className="intel-label">EVIDENCE</div>
                    <div className="data-value">{c.evidenceCount}</div>
                  </div>
                  <div>
                    <div className="intel-label">ENTITIES</div>
                    <div className="data-value">{c.entityCount.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }} className="hide-mobile">
                  <div className="intel-label">LAST ACTIVITY</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    {new Date(c.updatedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Investigation Modes ── */}
        <div style={{ width: '100%', maxWidth: '900px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div className="section-header">INVESTIGATION MODES</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Select investigation approach based on available intelligence
            </div>
          </div>
          <InvestigationModes />
        </div>

        {/* ── Pipeline visualization ── */}
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-dim)',
            padding: '16px',
          }}
        >
          <div className="section-header" style={{ marginBottom: '14px' }}>AI-ASSISTED INTELLIGENCE PIPELINE</div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
            {[
              'FRAGMENTED DATA',
              'ENTITY EXTRACTION',
              'ENTITY RESOLUTION',
              'RELATIONSHIP DISCOVERY',
              'KNOWLEDGE GRAPH',
              'NETWORK ANALYSIS',
              'INVESTIGATION CANDIDATES',
              'EVIDENCE-BACKED INSIGHTS',
            ].map((step, i, arr) => (
              <React.Fragment key={step}>
                <div
                  style={{
                    padding: '5px 10px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-base)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.55rem',
                    letterSpacing: '0.1em',
                    color: i === arr.length - 1 ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {step}
                </div>
                {i < arr.length - 1 && (
                  <span style={{ color: 'var(--accent-dim)', fontSize: '0.7rem' }}>›</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <div
            style={{
              marginTop: '12px',
              padding: '8px 10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-dim)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.58rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            AI-generated investigation insights are intended to assist investigators and require human verification. Synthetic data is used for this demonstration.
          </div>
        </div>

        {/* Padding */}
        <div style={{ height: '20px' }} />
      </div>
    </div>
  );
};

export default HomePage;
