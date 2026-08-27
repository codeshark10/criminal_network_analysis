// ============================================================
// NEXUS — Central CASES Intelligence Circle
// The visual and functional centerpiece of the dashboard
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CasesCircleProps {
  activeCount: number;
  pastCount: number;
  totalCount?: number;
  underReviewCount?: number;
}

const CasesCircle: React.FC<CasesCircleProps> = ({ activeCount, pastCount, totalCount, underReviewCount = 0 }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [tick, setTick] = useState(0);

  // Ticker for animated data markers
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 100), 2000);
    return () => clearInterval(id);
  }, []);

  const size = 290;
  const cx = size / 2;
  const cy = size / 2;

  // Outer ring data markers (12 positions)
  const markers = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pulse rings */}
      {hovered && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: '-30px',
              borderRadius: '50%',
              border: '1px solid var(--accent)',
              opacity: 0,
              animation: 'ring-pulse 2.5s ease-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '-30px',
              borderRadius: '50%',
              border: '1px solid var(--accent)',
              opacity: 0,
              animation: 'ring-pulse 2.5s ease-out infinite 1.25s',
            }}
          />
        </>
      )}

      {/* Main SVG circle */}
      <svg width={size} height={size} style={{ display: 'block' }}>
        {/* Outer glow circle */}
        <circle
          cx={cx} cy={cy}
          r={cx - 4}
          fill="none"
          stroke="rgba(201,184,106,0.06)"
          strokeWidth="40"
        />

        {/* Outer ring */}
        <circle
          cx={cx} cy={cy}
          r={cx - 6}
          fill="none"
          stroke="rgba(201,184,106,0.2)"
          strokeWidth="0.5"
        />

        {/* Second ring */}
        <circle
          cx={cx} cy={cy}
          r={cx - 20}
          fill="none"
          stroke="rgba(201,184,106,0.12)"
          strokeWidth="0.5"
        />

        {/* Third ring */}
        <circle
          cx={cx} cy={cy}
          r={cx - 40}
          fill="none"
          stroke="rgba(201,184,106,0.08)"
          strokeWidth="0.5"
        />

        {/* Inner ring */}
        <circle
          cx={cx} cy={cy}
          r={cx - 60}
          fill="none"
          stroke="rgba(201,184,106,0.15)"
          strokeWidth="0.5"
        />

        {/* Center fill */}
        <circle
          cx={cx} cy={cy}
          r={cx - 62}
          fill="var(--bg-surface)"
        />

        {/* Animated arc segments on outer ring */}
        {[0, 90, 180, 270].map((startAngle, i) => {
          const r = cx - 6;
          const arcLen = 60;
          const totalArc = 360;
          const sa = ((startAngle + tick * 1.5) % totalArc) * Math.PI / 180;
          const ea = sa + (arcLen * Math.PI / 180);
          const x1 = cx + r * Math.cos(sa);
          const y1 = cy + r * Math.sin(sa);
          const x2 = cx + r * Math.cos(ea);
          const y2 = cy + r * Math.sin(ea);
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
              fill="none"
              stroke="rgba(201,184,106,0.35)"
              strokeWidth="1.5"
              className="animate-spin-slow"
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          );
        })}

        {/* Data markers on outer ring */}
        {markers.map((deg, i) => {
          const rad = deg * Math.PI / 180;
          const r = cx - 6;
          const x = cx + r * Math.cos(rad);
          const y = cy + r * Math.sin(rad);
          const isActive = i % 3 === 0;
          return (
            <circle
              key={deg}
              cx={x} cy={y}
              r={isActive ? 2.5 : 1.5}
              fill={isActive ? 'var(--accent)' : 'var(--border-base)'}
              opacity={isActive ? 0.9 : 0.4}
            />
          );
        })}

        {/* Rotating indicator on second ring */}
        <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'spin-slow 15s linear infinite' }}>
          {[0, 120, 240].map((deg, i) => {
            const rad = deg * Math.PI / 180;
            const r = cx - 20;
            const x = cx + r * Math.cos(rad);
            const y = cy + r * Math.sin(rad);
            return (
              <rect
                key={i}
                x={x - 2} y={y - 2}
                width="4" height="4"
                fill="none"
                stroke="rgba(201,184,106,0.4)"
                strokeWidth="0.5"
                transform={`rotate(45, ${x}, ${y})`}
              />
            );
          })}
        </g>

        {/* Reverse rotating indicator */}
        <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'spin-reverse-slow 25s linear infinite' }}>
          {[60, 180, 300].map((deg, i) => {
            const rad = deg * Math.PI / 180;
            const r = cx - 40;
            const x = cx + r * Math.cos(rad);
            const y = cy + r * Math.sin(rad);
            return (
              <circle key={i} cx={x} cy={y} r="1.5" fill="rgba(201,184,106,0.25)" />
            );
          })}
        </g>

        {/* Cross-hairs inside */}
        <line x1={cx - 30} y1={cy} x2={cx + 30} y2={cy} stroke="rgba(201,184,106,0.06)" strokeWidth="0.5" />
        <line x1={cx} y1={cy - 30} x2={cx} y2={cy + 30} stroke="rgba(201,184,106,0.06)" strokeWidth="0.5" />

        {/* Center text: CASES */}
        <text
          x={cx} y={cy - 10}
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize="18"
          fontWeight="300"
          fontFamily="'JetBrains Mono', monospace"
          letterSpacing="6"
          style={{ userSelect: 'none' }}
        >
          CASES
        </text>
        <text
          x={cx} y={cy + 4}
          textAnchor="middle"
          fill="var(--accent)"
          fontSize="5.5"
          fontFamily="'JetBrains Mono', monospace"
          letterSpacing="3"
          style={{ userSelect: 'none' }}
        >
          INTELLIGENCE HUB
        </text>

        {/* Case count arc segments */}
        {/* Active cases */}
        <text
          x={cx} y={cy + 20}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize="5"
          fontFamily="'JetBrains Mono', monospace"
          letterSpacing="1.5"
          style={{ userSelect: 'none' }}
        >
          {activeCount} ACTIVE · {underReviewCount} REVIEW · {pastCount} CLOSED
        </text>
        <text
          x={cx} y={cy + 32}
          textAnchor="middle"
          fill="var(--accent-dim)"
          fontSize="8"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="300"
          letterSpacing="2"
          style={{ userSelect: 'none' }}
        >
          {totalCount ?? (activeCount + pastCount + underReviewCount)} TOTAL
        </text>
      </svg>

      {/* Outer label: top */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.5rem',
          letterSpacing: '0.2em',
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        CASE DATABASE // ACTIVE
      </div>

      {/* Outer label: bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '-20px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.5rem',
          letterSpacing: '0.2em',
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}
      >
        INTELLIGENCE CORE // ONLINE
      </div>

      {/* Click actions (Hover Menu) */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '180px',
            height: '180px',
            background: 'var(--bg-surface)',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            zIndex: 50,
          }}
        >
          {[
            { label: 'ACTIVE CASES', path: '/cases?tab=active' },
            { label: 'PAST CASES',   path: '/cases?tab=past' },
            { label: '+ NEW CASE',   path: '/cases?create=true' },
          ].map(({ label, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-dim)',
                color: label.startsWith('+') ? 'var(--accent)' : 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                letterSpacing: '0.12em',
                padding: '8px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                width: '140px',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = 'var(--accent-faint)';
                (e.target as HTMLButtonElement).style.color = 'var(--accent)';
                (e.target as HTMLButtonElement).style.borderColor = 'var(--accent-dim)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = 'var(--bg-elevated)';
                (e.target as HTMLButtonElement).style.color = label.startsWith('+') ? 'var(--accent)' : 'var(--text-primary)';
                (e.target as HTMLButtonElement).style.borderColor = 'var(--border-dim)';
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CasesCircle;
