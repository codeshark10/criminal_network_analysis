// ============================================================
// NEXUS — Network Analysis Page
// Full-screen D3 knowledge graph — data from FastAPI/Neo4j
// with graceful fallback to static demo data when backend offline
// ============================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ZoomIn, ZoomOut, RefreshCw, Filter, X, ChevronRight, Loader2, AlertTriangle, Database } from 'lucide-react';
import NetworkGraph from '../components/graph/NetworkGraph';
import { getFullGraph, getSuspectRelationships, getExecutiveSummary } from '../services/apiClient';
import { adaptApiGraph } from '../services/adapters';
import type { GraphNode, GraphRelationship, EntityType } from '../types/graph';

// ── Constants ────────────────────────────────────────────────

const ENTITY_TYPES: { type: EntityType; label: string }[] = [
  { type: 'PERSON',       label: 'People' },
  { type: 'ORGANIZATION', label: 'Organizations' },
  { type: 'LOCATION',     label: 'Locations' },
  { type: 'PHONE',        label: 'Phones' },
  { type: 'VEHICLE',      label: 'Vehicles' },
  { type: 'BANK_ACCOUNT', label: 'Accounts' },
  { type: 'TRANSACTION',  label: 'Transactions' },
  { type: 'EVIDENCE',     label: 'Evidence / Other' },
];

// ── Shared status banner ─────────────────────────────────────

const OfflineBanner: React.FC<{ onRetry: () => void, message?: string }> = ({ onRetry, message }) => (
  <div style={{
    position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
    zIndex: 50, display: 'flex', alignItems: 'center', gap: '8px',
    padding: '6px 14px', background: 'rgba(107,90,42,0.92)',
    border: '1px solid var(--warning)', fontSize: '0.68rem',
    fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: '#D4B86A',
    backdropFilter: 'blur(4px)',
  }}>
    <AlertTriangle size={11} />
    {message ? message.toUpperCase() : 'NO DATA / BACKEND OFFLINE'}
    <button
      onClick={onRetry}
      style={{ background: 'none', border: '1px solid var(--warning)', padding: '2px 8px', cursor: 'pointer', color: '#D4B86A', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', marginLeft: '4px' }}
    >
      RETRY
    </button>
  </div>
);

const LiveBanner: React.FC<{ nodeCount: number; edgeCount: number }> = ({ nodeCount, edgeCount }) => (
  <div style={{
    position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
    zIndex: 50, display: 'flex', alignItems: 'center', gap: '6px',
    padding: '4px 12px', background: 'rgba(58,94,58,0.88)',
    border: '1px solid var(--operational)', fontSize: '0.6rem',
    fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: '#6A9E6A',
    backdropFilter: 'blur(4px)',
  }}>
    <Database size={10} />
    LIVE — {nodeCount} NODES · {edgeCount} EDGES FROM NEO4J
  </div>
);

// ── Main page ────────────────────────────────────────────────

const NetworkAnalysisPage: React.FC = () => {
  const { caseId } = useParams<{ caseId?: string }>();

  // ── Data state ───────────────────────────────────────────
  const [allNodes, setAllNodes] = useState<GraphNode[]>([]);
  const [allRelationships, setAllRelationships] = useState<GraphRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);   // true = real backend data
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [graphMode, setGraphMode] = useState<'full' | 'executive'>('full');

  // ── Exec Summary Params ──────────────────────────────────
  const [execParams, setExecParams] = useState({ maxNodes: 20, maxRels: 6, minConnections: 1 });
  const [localExecParams, setLocalExecParams] = useState({ maxNodes: 20, maxRels: 6, minConnections: 1 });

  // ── UI state ─────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedRel, setSelectedRel] = useState<GraphRelationship | null>(null);
  const [filterTypes, setFilterTypes] = useState<EntityType[]>(ENTITY_TYPES.map((e) => e.type));
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [centerId, setCenterId] = useState<string>('');

  const fetchGraph = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setFetchError(null);
    try {
      const result = graphMode === 'executive' 
        ? await getExecutiveSummary(caseId, execParams.maxNodes, execParams.maxRels, execParams.minConnections) 
        : await getFullGraph(caseId, 500);
      const adapted = adaptApiGraph(result.nodes, result.edges);

      if (adapted.nodes.length === 0) {
        // Backend replied but graph is empty — fall back
        throw new Error('Knowledge graph is empty. Upload and process documents first.');
      }

      setAllNodes(adapted.nodes);
      setAllRelationships(adapted.relationships);
      setIsLive(true);

      // Pick first PERSON as default center
      const firstPerson = adapted.nodes.find((n) => n.type === 'PERSON');
      setCenterId(firstPerson?.id ?? adapted.nodes[0]?.id ?? '');
    } catch (err) {
      // Show empty graph
      setAllNodes([]);
      setAllRelationships([]);
      setIsLive(false);
      setFetchError(err instanceof Error ? err.message : 'Backend unreachable');
      setCenterId('');
    } finally {
      setLoading(false);
    }
  }, [caseId, graphMode, execParams]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  // ── "Expand network" — fetch suspect-specific subgraph ───
  const expandSuspect = useCallback(async (node: GraphNode) => {
    if (!isLive || !caseId) return; // only works with real backend
    setLoading(true);
    try {
      const result = await getSuspectRelationships(caseId, node.displayName, 150);
      if (result.nodes.length > 0) {
        const adapted = adaptApiGraph(result.nodes, result.edges);
        setAllNodes(adapted.nodes);
        setAllRelationships(adapted.relationships);
        setCenterId(node.id);
        setSelectedNode(null);
      }
    } catch {
      // silently keep existing graph
    } finally {
      setLoading(false);
    }
  }, [isLive]);

  // ── Derived graph: apply entity type filter + search ─────
  const filteredData = useMemo(() => {
    let nodes = allNodes.filter((n) => filterTypes.includes(n.type));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchIds = new Set(
        nodes
          .filter((n) => n.displayName.toLowerCase().includes(q))
          .map((n) => n.id)
      );
      nodes = nodes.filter((n) => matchIds.has(n.id));
    }

    const nodeIdSet = new Set(nodes.map((n) => n.id));
    const relationships = allRelationships.filter(
      (r) => nodeIdSet.has(r.source as string) && nodeIdSet.has(r.target as string)
    );
    return { nodes, relationships };
  }, [allNodes, allRelationships, filterTypes, searchQuery]);

  // ── Sidebar: connected entities for selected node ─────────
  const connectedEntities = useMemo(() => {
    if (!selectedNode) return [];
    return allRelationships
      .filter((r) => r.source === selectedNode.id || r.target === selectedNode.id)
      .slice(0, 12)
      .map((r) => {
        const otherId = r.source === selectedNode.id ? r.target : r.source;
        const other = allNodes.find((n) => n.id === otherId);
        return other ? { node: other, relationship: r } : null;
      })
      .filter(Boolean) as { node: GraphNode; relationship: GraphRelationship }[];
  }, [selectedNode, allNodes, allRelationships]);

  const centerNode = allNodes.find((n) => n.id === centerId);
  const personNodes = allNodes.filter((n) => n.type === 'PERSON').slice(0, 8);

  const toggleFilter = (type: EntityType) => {
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // ── Loading overlay ──────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={28} className="animate-spin-slow" style={{ color: 'var(--accent)' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
          FETCHING KNOWLEDGE GRAPH FROM NEO4J...
        </div>
      </div>
    );
  }

  if (!caseId) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
          NO CASE SELECTED. PLEASE SELECT A CASE FROM THE HOMEPAGE TO VIEW THE NETWORK GRAPH.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Left: Filter Panel */}
      <div style={{
        width: showFilters ? '200px' : '0',
        overflow: 'hidden',
        transition: 'width 0.25s ease',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-dim)',
        flexShrink: 0,
      }}>
        <div style={{ width: '200px', padding: '14px', height: '100%', overflowY: 'auto' }}>
          
          {graphMode === 'executive' && (
            <>
              <div className="section-header" style={{ marginBottom: '12px' }}>EXECUTIVE PARAMS</div>
              
              <div className="intel-label" style={{ marginBottom: '4px' }}>MAX NODES (5-50)</div>
              <input
                type="number"
                min={5}
                max={50}
                value={localExecParams.maxNodes}
                onChange={(e) => setLocalExecParams(p => ({ ...p, maxNodes: parseInt(e.target.value) || 5 }))}
                className="intel-input"
                style={{ width: '100%', marginBottom: '12px', padding: '4px 8px' }}
              />

              <div className="intel-label" style={{ marginBottom: '4px' }}>MAX RELS / NODE (1-20)</div>
              <input
                type="number"
                min={1}
                max={20}
                value={localExecParams.maxRels}
                onChange={(e) => setLocalExecParams(p => ({ ...p, maxRels: parseInt(e.target.value) || 1 }))}
                className="intel-input"
                style={{ width: '100%', marginBottom: '12px', padding: '4px 8px' }}
              />

              <div className="intel-label" style={{ marginBottom: '4px' }}>MIN CONNECTIONS</div>
              <input
                type="number"
                min={1}
                value={localExecParams.minConnections}
                onChange={(e) => setLocalExecParams(p => ({ ...p, minConnections: parseInt(e.target.value) || 1 }))}
                className="intel-input"
                style={{ width: '100%', marginBottom: '12px', padding: '4px 8px' }}
              />

              <button
                className="btn btn--accent"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.62rem', marginBottom: '12px' }}
                onClick={() => setExecParams(localExecParams)}
              >
                APPLY PARAMS
              </button>
              
              <div className="divider" style={{ margin: '12px 0' }} />
            </>
          )}

          <div className="section-header" style={{ marginBottom: '12px' }}>FILTERS</div>

          {/* Entity type checkboxes */}
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

          {/* Center node selector */}
          <div className="intel-label" style={{ marginBottom: '8px' }}>CENTER NODE</div>
          {personNodes.map((n) => (
            <button
              key={n.id}
              onClick={() => { setCenterId(n.id); setSelectedNode(null); }}
              style={{
                width: '100%', padding: '5px 8px', marginBottom: '2px',
                background: centerId === n.id ? 'var(--accent-faint)' : 'transparent',
                border: `1px solid ${centerId === n.id ? 'var(--accent-dim)' : 'transparent'}`,
                color: centerId === n.id ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              {n.displayName}
            </button>
          ))}

          <div className="divider" style={{ margin: '12px 0' }} />

          <button
            className="btn btn--ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.62rem' }}
            onClick={fetchGraph}
          >
            <RefreshCw size={10} /> RELOAD GRAPH
          </button>

          <div style={{ marginTop: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-faint)', letterSpacing: '0.08em' }}>
            {isLive ? `LIVE · ${allNodes.length} nodes` : 'NO DATA'}
          </div>
        </div>
      </div>

      {/* Center: Graph */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          height: '40px', background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-dim)',
          display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px', flexShrink: 0,
        }}>
          <button className="btn btn--ghost" style={{ padding: '4px 8px', fontSize: '0.62rem' }} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={11} /> FILTERS
          </button>

          <div className="divider" style={{ width: '1px', height: '20px' }} />

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            CENTER: {centerNode?.displayName || centerId || '—'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            {filteredData.nodes.length} NODES · {filteredData.relationships.length} EDGES
          </div>

          {!isLive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--warning)', padding: '2px 8px', border: '1px solid var(--warning)', letterSpacing: '0.06em' }}>
              <AlertTriangle size={10} /> OFFLINE
            </div>
          )}
          <div style={{ flex: 1 }} />

          {/* Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-raised)', border: '1px solid var(--border-dim)', borderRadius: '2px', overflow: 'hidden', marginRight: '12px' }}>
            <button
              className={`btn ${graphMode === 'full' ? 'btn--accent' : 'btn--ghost'}`}
              style={{ border: 'none', borderRadius: 0, padding: '4px 10px', fontSize: '0.62rem' }}
              onClick={() => setGraphMode('full')}
            >
              FULL GRAPH
            </button>
            <button
              className={`btn ${graphMode === 'executive' ? 'btn--accent' : 'btn--ghost'}`}
              style={{ border: 'none', borderRadius: 0, padding: '4px 10px', fontSize: '0.62rem' }}
              onClick={() => setGraphMode('executive')}
            >
              EXECUTIVE SUMMARY
            </button>
          </div>

          <input
            className="intel-input"
            style={{ width: '160px', padding: '4px 8px' }}
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button
            className="btn btn--ghost"
            style={{ padding: '4px 8px', fontSize: '0.62rem' }}
            onClick={fetchGraph}
            title="Reload graph from backend"
          >
            <RefreshCw size={11} />
          </button>

          <div className="intel-label">LAYOUT: FORCE DIRECTED</div>
        </div>

        {/* Graph canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <NetworkGraph
            nodes={filteredData.nodes}
            relationships={filteredData.relationships}
            centerNodeId={centerId}
            onNodeSelect={setSelectedNode}
            onRelationshipSelect={setSelectedRel}
            selectedNodeId={selectedNode?.id}
          />

          {/* Status banners */}
          {isLive && !fetchError && (
            <LiveBanner nodeCount={allNodes.length} edgeCount={allRelationships.length} />
          )}
          {!isLive && fetchError && (
            <OfflineBanner onRetry={fetchGraph} message={fetchError} />
          )}

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: '12px', left: '12px',
            background: 'rgba(13,16,18,0.9)', border: '1px solid var(--border-dim)', padding: '10px 12px',
          }}>
            <div className="intel-label" style={{ marginBottom: '6px' }}>LEGEND</div>
            {[
              { color: '#C9B86A', label: 'Person / Suspect' },
              { color: '#8A7E45', label: 'Organization' },
              { color: '#6B6040', label: 'Location' },
              { color: '#5A5348', label: 'Phone / Vehicle' },
              { color: '#9A7E35', label: 'Financial' },
              { color: '#5E5040', label: 'Evidence / Other' },
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
      <div style={{
        width: selectedNode || selectedRel ? '280px' : '0',
        transition: 'width 0.25s ease',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-dim)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
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

              {/* Priority bar (only if > 0) */}
              {(selectedNode.investigationPriority ?? 0) > 0 && (
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
              {Object.entries(selectedNode.properties)
                .filter(([, v]) => v !== undefined && v !== null && v !== '')
                .slice(0, 8)
                .map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="data-key">{k.toUpperCase()}</span>
                    <span className="data-value" style={{ fontSize: '0.65rem', textAlign: 'right', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {String(v)}
                    </span>
                  </div>
                ))}

              <div className="divider" style={{ margin: '10px 0' }} />

              {/* Connected entities */}
              <div className="intel-label" style={{ marginBottom: '6px' }}>
                CONNECTED ENTITIES ({connectedEntities.length})
              </div>
              {connectedEntities.length === 0 && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>None visible with current filters</div>
              )}
              {connectedEntities.map(({ node, relationship }) => (
                <div
                  key={node.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0', borderBottom: '1px solid var(--border-faint)', cursor: 'pointer' }}
                  onClick={() => setSelectedNode(node)}
                >
                  <ChevronRight size={10} style={{ color: 'var(--accent-dim)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{node.displayName}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-muted)' }}>{relationship.type}</div>
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div className="divider" style={{ margin: '10px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {selectedNode.type === 'PERSON' && (
                  <>
                    <button
                      className="btn btn--ghost"
                      style={{ justifyContent: 'center', width: '100%', fontSize: '0.62rem' }}
                      onClick={() => expandSuspect(selectedNode)}
                      title={isLive ? 'Fetch suspect subgraph from backend' : 'Backend offline'}
                      disabled={!isLive}
                    >
                      {isLive ? 'EXPAND NETWORK' : 'EXPAND (OFFLINE)'}
                    </button>
                    <button
                      className="btn btn--ghost"
                      style={{ justifyContent: 'center', width: '100%', fontSize: '0.62rem' }}
                      onClick={() => { setCenterId(selectedNode.id); setSelectedNode(null); }}
                    >
                      SET AS CENTER
                    </button>
                  </>
                )}
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
                {allNodes.find((n) => n.id === selectedRel.source)?.displayName || selectedRel.source as string}
              </div>

              <div className="intel-label" style={{ marginBottom: '6px' }}>TARGET</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                {allNodes.find((n) => n.id === selectedRel.target)?.displayName || selectedRel.target as string}
              </div>

              {selectedRel.properties.description && (
                <>
                  <div className="divider" style={{ margin: '10px 0' }} />
                  <div className="intel-label" style={{ marginBottom: '4px' }}>EVIDENCE</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedRel.properties.description}
                  </div>
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
