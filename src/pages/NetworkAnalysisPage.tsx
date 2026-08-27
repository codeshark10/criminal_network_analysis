// ============================================================
// NEXUS — Network Analysis Page
// Full-screen knowledge graph workspace
// ============================================================

import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ZoomIn, ZoomOut, RefreshCw, Filter, X, ChevronRight } from 'lucide-react';
import NetworkGraph from '../components/graph/NetworkGraph';
import { graphNodes, getGraphNodesByCase } from '../data/graphNodes';
import { graphRelationships } from '../data/graphRelationships';
import { getNetworkAtDepth, getConnectedEntities } from '../services/investigationEngine';
import type { GraphNode, GraphRelationship, EntityType } from '../types/graph';
import { persons } from '../data/persons';
import { evidenceRecords } from '../data/evidence';

const ENTITY_TYPES: { type: EntityType; label: string }[] = [
  { type: 'PERSON',       label: 'People' },
  { type: 'ORGANIZATION', label: 'Organizations' },
  { type: 'LOCATION',     label: 'Locations' },
  { type: 'PHONE',        label: 'Phones' },
  { type: 'VEHICLE',      label: 'Vehicles' },
  { type: 'BANK_ACCOUNT', label: 'Accounts' },
  { type: 'TRANSACTION',  label: 'Transactions' },
  { type: 'EVIDENCE',     label: 'Evidence' },
];

const NetworkAnalysisPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();

  // Determine default center node based on case
  const caseNodes = caseId ? getGraphNodesByCase(caseId) : graphNodes;
  const defaultCenter = caseNodes.find((n) => n.type === 'PERSON')?.id ?? 'person-001';

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedRel, setSelectedRel] = useState<GraphRelationship | null>(null);
  const [depth, setDepth] = useState(2);
  const [centerId, setCenterId] = useState(defaultCenter);
  const [filterTypes, setFilterTypes] = useState<EntityType[]>(ENTITY_TYPES.map((e) => e.type));
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Build graph at current depth
  const graphData = useMemo(() => {
    return getNetworkAtDepth(centerId, depth);
  }, [centerId, depth]);

  // Apply entity type filter
  const filteredData = useMemo(() => {
    const filteredNodeIds = new Set(graphData.nodes.filter((n) => filterTypes.includes(n.type)).map((n) => n.id));
    const nodes = graphData.nodes.filter((n) => filteredNodeIds.has(n.id));
    const relationships = graphData.relationships.filter(
      (r) => filteredNodeIds.has(r.source as string) && filteredNodeIds.has(r.target as string)
    );
    return { nodes, relationships };
  }, [graphData, filterTypes]);

  const connectedEntities = useMemo(() => {
    if (!selectedNode) return [];
    return getConnectedEntities(selectedNode.id);
  }, [selectedNode]);

  const centerNode = graphNodes.find((n) => n.id === centerId);
  const centerPerson = selectedNode?.type === 'PERSON'
    ? persons.find((p) => p.id === selectedNode.id)
    : null;
  const nodeEvidence = selectedNode
    ? evidenceRecords.filter((e) => e.relatedPersonIds.includes(selectedNode.id) || e.relatedOrgIds.includes(selectedNode.id))
    : [];

  const toggleFilter = (type: EntityType) => {
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left: Filter Panel */}
      <div
        style={{
          width: showFilters ? '200px' : '0',
          overflow: 'hidden',
          transition: 'width 0.25s ease',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-dim)',
          flexShrink: 0,
        }}
      >
        <div style={{ width: '200px', padding: '14px', height: '100%', overflowY: 'auto' }}>
          <div className="section-header" style={{ marginBottom: '12px' }}>FILTERS</div>

          {/* Entity Types */}
          <div className="intel-label" style={{ marginBottom: '8px' }}>ENTITY TYPE</div>
          {ENTITY_TYPES.map(({ type, label }) => (
            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterTypes.includes(type)}
                onChange={() => toggleFilter(type)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: '0.7rem', color: filterTypes.includes(type) ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                {label}
              </span>
            </label>
          ))}

          <div className="divider" style={{ margin: '12px 0' }} />

          {/* Depth */}
          <div className="intel-label" style={{ marginBottom: '8px' }}>NETWORK DEPTH</div>
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              onClick={() => setDepth(d)}
              style={{
                width: '100%',
                padding: '6px',
                marginBottom: '4px',
                background: depth === d ? 'var(--accent-faint)' : 'transparent',
                border: `1px solid ${depth === d ? 'var(--accent-dim)' : 'var(--border-dim)'}`,
                color: depth === d ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                cursor: 'pointer',
                textAlign: 'left',
                letterSpacing: '0.08em',
              }}
            >
              DEPTH {d} — {d === 1 ? 'Direct' : d === 2 ? '2nd Degree' : '3rd Degree'}
            </button>
          ))}

          <div className="divider" style={{ margin: '12px 0' }} />

          {/* Center node select */}
          <div className="intel-label" style={{ marginBottom: '8px' }}>CENTER NODE</div>
          {graphNodes.filter((n) => n.type === 'PERSON').slice(0, 6).map((n) => (
            <button
              key={n.id}
              onClick={() => { setCenterId(n.id); setSelectedNode(null); }}
              style={{
                width: '100%',
                padding: '5px 8px',
                marginBottom: '2px',
                background: centerId === n.id ? 'var(--accent-faint)' : 'transparent',
                border: `1px solid ${centerId === n.id ? 'var(--accent-dim)' : 'transparent'}`,
                color: centerId === n.id ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {n.displayName}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Graph */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div
          style={{
            height: '40px',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-dim)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <button
            className="btn btn--ghost"
            style={{ padding: '4px 8px', fontSize: '0.62rem' }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={11} /> FILTERS
          </button>

          <div className="divider" style={{ width: '1px', height: '20px' }} />

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            CENTER: {centerNode?.displayName || centerId}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            {filteredData.nodes.length} NODES · {filteredData.relationships.length} EDGES · DEPTH {depth}
          </div>

          <div style={{ flex: 1 }} />

          {/* Graph search */}
          <input
            className="intel-input"
            style={{ width: '160px', padding: '4px 8px' }}
            placeholder="Search graph..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="intel-label">LAYOUT: FORCE DIRECTED</div>
        </div>

        {/* Graph Area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <NetworkGraph
            nodes={filteredData.nodes}
            relationships={filteredData.relationships}
            centerNodeId={centerId}
            onNodeSelect={setSelectedNode}
            onRelationshipSelect={setSelectedRel}
            selectedNodeId={selectedNode?.id}
          />

          {/* Graph Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(13,16,18,0.9)',
              border: '1px solid var(--border-dim)',
              padding: '10px 12px',
            }}
          >
            <div className="intel-label" style={{ marginBottom: '6px' }}>LEGEND</div>
            {[
              { color: '#C9B86A', label: 'Person' },
              { color: '#8A7E45', label: 'Organization' },
              { color: '#6B6040', label: 'Location' },
              { color: '#5A5348', label: 'Phone/Vehicle' },
              { color: '#9A7E35', label: 'Transaction' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: `1px solid ${color}`, background: 'transparent' }} />
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Intelligence Panel */}
      <div
        style={{
          width: selectedNode || selectedRel ? '280px' : '0',
          transition: 'width 0.25s ease',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-dim)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div style={{ width: '280px', height: '100%', overflowY: 'auto', padding: '14px' }}>
          {/* Node detail */}
          {selectedNode && !selectedRel && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div className="section-header">{selectedNode.type}</div>
                <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '4px' }}>
                {selectedNode.displayName}
              </div>

              {selectedNode.investigationPriority && (
                <div style={{ marginBottom: '12px' }}>
                  <div className="intel-label" style={{ marginBottom: '3px' }}>INVESTIGATION PRIORITY</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-track" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${selectedNode.investigationPriority}%` }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)' }}>
                      {selectedNode.investigationPriority}/100
                    </span>
                  </div>
                </div>
              )}

              <div className="divider" style={{ marginBottom: '10px' }} />

              {/* Properties */}
              <div className="intel-label" style={{ marginBottom: '6px' }}>PROPERTIES</div>
              {Object.entries(selectedNode.properties).slice(0, 6).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="data-key">{k.toUpperCase()}</span>
                  <span className="data-value" style={{ fontSize: '0.65rem', textAlign: 'right', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {String(v)}
                  </span>
                </div>
              ))}

              <div className="divider" style={{ margin: '10px 0' }} />

              {/* Connected entities */}
              <div className="intel-label" style={{ marginBottom: '6px' }}>
                CONNECTED ENTITIES ({connectedEntities.length})
              </div>
              {connectedEntities.slice(0, 8).map(({ node, relationship }) => (
                <div
                  key={node.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 0',
                    borderBottom: '1px solid var(--border-faint)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedNode(node)}
                >
                  <ChevronRight size={10} style={{ color: 'var(--accent-dim)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{node.displayName}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)' }}>{relationship.type}</div>
                  </div>
                </div>
              ))}

              {/* Evidence */}
              {nodeEvidence.length > 0 && (
                <>
                  <div className="divider" style={{ margin: '10px 0' }} />
                  <div className="intel-label" style={{ marginBottom: '6px' }}>EVIDENCE ({nodeEvidence.length})</div>
                  {nodeEvidence.slice(0, 4).map((e) => (
                    <div key={e.id} style={{ padding: '5px 0', borderBottom: '1px solid var(--border-faint)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent)' }}>{e.id}</span>
                        <span className={`badge badge--${e.flagged ? 'high' : 'closed'}`} style={{ fontSize: '0.5rem' }}>{e.type}</span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>{e.date} · {e.confidence}%</div>
                    </div>
                  ))}
                </>
              )}

              {/* Actions */}
              <div className="divider" style={{ margin: '10px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {selectedNode.type === 'PERSON' && (
                  <>
                    <button className="btn btn--ghost" style={{ justifyContent: 'center', width: '100%', fontSize: '0.62rem' }}
                      onClick={() => { setCenterId(selectedNode.id); }}>
                      EXPAND NETWORK
                    </button>
                    <button className="btn btn--ghost" style={{ justifyContent: 'center', width: '100%', fontSize: '0.62rem' }}
                      onClick={() => window.location.href = `/persons/${selectedNode.id}`}>
                      VIEW PROFILE
                    </button>
                  </>
                )}
                <button className="btn btn--ghost" style={{ justifyContent: 'center', width: '100%', fontSize: '0.62rem' }}
                  onClick={() => window.location.href = '/evidence'}>
                  VIEW EVIDENCE
                </button>
              </div>
            </div>
          )}

          {/* Relationship detail */}
          {selectedRel && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div className="section-header">RELATIONSHIP</div>
                <button onClick={() => setSelectedRel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent)', letterSpacing: '0.06em', marginBottom: '12px' }}>
                {selectedRel.type}
              </div>

              <div className="intel-label" style={{ marginBottom: '6px' }}>SOURCE</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                {graphNodes.find((n) => n.id === selectedRel.source)?.displayName || selectedRel.source as string}
              </div>

              <div className="intel-label" style={{ marginBottom: '6px' }}>TARGET</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                {graphNodes.find((n) => n.id === selectedRel.target)?.displayName || selectedRel.target as string}
              </div>

              <div className="divider" style={{ margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div>
                  <div className="intel-label">CONFIDENCE</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent)' }}>
                    {Math.round((selectedRel.properties.confidence || 0) * 100)}%
                  </div>
                </div>
                <div>
                  <div className="intel-label">EVIDENCE</div>
                  <div className="data-value">{selectedRel.properties.evidenceCount || 0} records</div>
                </div>
              </div>

              {selectedRel.properties.description && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                  {selectedRel.properties.description}
                </div>
              )}

              {selectedRel.properties.firstObserved && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div><div className="data-key">FIRST OBSERVED</div><div className="data-value" style={{ fontSize: '0.65rem' }}>{selectedRel.properties.firstObserved}</div></div>
                  <div><div className="data-key">LAST OBSERVED</div><div className="data-value" style={{ fontSize: '0.65rem' }}>{selectedRel.properties.lastObserved}</div></div>
                </div>
              )}

              {selectedRel.properties.evidenceIds && selectedRel.properties.evidenceIds.length > 0 && (
                <>
                  <div className="divider" style={{ margin: '10px 0' }} />
                  <div className="intel-label" style={{ marginBottom: '6px' }}>SUPPORTING EVIDENCE</div>
                  {selectedRel.properties.evidenceIds.map((eid) => (
                    <div key={eid} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent)', padding: '3px 0', borderBottom: '1px solid var(--border-faint)' }}>
                      {eid}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkAnalysisPage;
