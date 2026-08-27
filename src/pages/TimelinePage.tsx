// ============================================================
// NEXUS — Timeline Page
// Visual investigation timeline
// ============================================================

import React, { useState } from 'react';
import { Clock, Filter } from 'lucide-react';
import type { InvestigationEvent } from '../types';

const investigationEvents: InvestigationEvent[] = [];

const importanceColor: Record<InvestigationEvent['importance'], string> = {
  HIGH: 'var(--accent)',
  MEDIUM: 'var(--text-secondary)',
  LOW: 'var(--text-muted)',
};

const typeBadgeClass: Record<string, string> = {
  Communication: 'badge--medium',
  Financial: 'badge--high',
  Surveillance: 'badge--closed',
  Wiretap: 'badge--critical',
  Alert: 'badge--critical',
};

const TimelinePage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const types = ['ALL', 'Communication', 'Financial', 'Surveillance', 'Wiretap', 'Alert'];

  const events = investigationEvents
    .filter((e) => typeFilter === 'ALL' || e.type === typeFilter)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div className="section-header">INVESTIGATION TIMELINE</div>
        <h1 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 300 }}>Case Activity Log</h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', marginBottom: '24px' }}>
        {types.map((t) => (
          <button key={t} className={`intel-tab ${typeFilter === t ? 'intel-tab--active' : ''}`}
            onClick={() => setTypeFilter(t)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: '30px' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: '10px', top: 0, bottom: 0, width: '1px', background: 'var(--border-dim)' }} />

        {events.map((event, i) => (
          <div
            key={event.id}
            style={{
              position: 'relative',
              marginBottom: '20px',
              paddingBottom: i < events.length - 1 ? '0' : '0',
            }}
          >
            {/* Timeline dot */}
            <div
              style={{
                position: 'absolute',
                left: '-24px',
                top: '4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: importanceColor[event.importance],
                border: `1px solid ${importanceColor[event.importance]}`,
                boxShadow: event.importance === 'HIGH' ? '0 0 6px rgba(201,184,106,0.4)' : 'none',
              }}
            />

            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                borderLeft: `2px solid ${importanceColor[event.importance]}`,
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>
                    {event.date} · {event.time}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className={`badge ${typeBadgeClass[event.type] || 'badge--closed'}`}>{event.type}</span>
                  <span className={`badge badge--${event.importance === 'HIGH' ? 'high' : event.importance === 'MEDIUM' ? 'medium' : 'closed'}`}>
                    {event.importance}
                  </span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{event.description}</p>
              {event.evidenceIds.length > 0 && (
                <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {event.evidenceIds.map((eid) => (
                    <span key={eid} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--accent)', background: 'var(--accent-faint)', padding: '1px 6px' }}>{eid}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelinePage;
