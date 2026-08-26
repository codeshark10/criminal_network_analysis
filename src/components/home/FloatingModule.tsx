// ============================================================
// NEXUS — Floating Intelligence Data Module
// Orbiting intelligence panels around the CASES circle
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';


export interface FloatingModuleProps {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  items?: { label: string; value: string | number }[];
  miniViz?: React.ReactNode;
  path: string;
  style?: React.CSSProperties;
  animationDelay?: number;
}

const FloatingModule: React.FC<FloatingModuleProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  items,
  miniViz,
  path,
  style,
  animationDelay = 0,
}) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [flickerValue, setFlickerValue] = useState(value);
  const mountedRef = useRef(false);

  // Subtle data flicker
  useEffect(() => {
    mountedRef.current = true;
    const id = setInterval(() => {
      if (!mountedRef.current) return;
      const n = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (!isNaN(n)) {
        const noise = Math.floor(Math.random() * 3) - 1;
        setFlickerValue(n + noise);
        setTimeout(() => {
          if (mountedRef.current) setFlickerValue(value);
        }, 120);
      }
    }, 3000 + animationDelay * 400);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [value, animationDelay]);

  return (
    <div
      onClick={() => navigate(path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        width: '160px',
        background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        border: `1px solid ${hovered ? 'var(--accent-dim)' : 'var(--border-base)'}`,
        padding: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: hovered ? '0 0 20px rgba(201,184,106,0.08)' : 'none',
        animation: `float-slow ${4 + animationDelay * 0.5}s ease-in-out infinite`,
        animationDelay: `${animationDelay * 0.4}s`,
        ...style,
      }}
    >
      {/* Corner accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '6px', borderTop: '1px solid var(--accent-dim)', borderLeft: '1px solid var(--accent-dim)' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: '6px', height: '6px', borderTop: '1px solid var(--accent-dim)', borderRight: '1px solid var(--accent-dim)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '6px', height: '6px', borderBottom: '1px solid var(--accent-dim)', borderLeft: '1px solid var(--accent-dim)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '6px', height: '6px', borderBottom: '1px solid var(--accent-dim)', borderRight: '1px solid var(--accent-dim)' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Icon size={10} style={{ color: 'var(--accent-dim)', flexShrink: 0 }} />
        <span className="section-header" style={{ fontSize: '0.55rem', letterSpacing: '0.18em' }}>{title}</span>
      </div>

      {/* Main value */}
      <div className="animate-data-flicker" style={{ marginBottom: '4px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.6rem',
            fontWeight: 300,
            color: 'var(--text-primary)',
            lineHeight: 1,
            display: 'block',
          }}
        >
          {typeof flickerValue === 'number' && flickerValue >= 1000
            ? flickerValue.toLocaleString()
            : flickerValue}
        </span>
      </div>

      {/* Subtitle */}
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '10px', fontFamily: 'var(--font-sans)' }}>
        {subtitle}
      </div>

      {/* Divider */}
      <div className="divider" style={{ marginBottom: '8px' }} />

      {/* Items list */}
      {items && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {items.map(({ label, value: v }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mini viz */}
      {miniViz && <div style={{ marginTop: '8px' }}>{miniViz}</div>}

      {/* Hover caret */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: '6px',
          right: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.55rem',
          color: 'var(--accent)',
          letterSpacing: '0.1em',
        }}>
          OPEN →
        </div>
      )}
    </div>
  );
};

export default FloatingModule;
