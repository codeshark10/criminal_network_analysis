// ============================================================
// NEXUS — Case Overview Page
// First page shown when entering a case workspace
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Users, Network, Shield, Clock, AlertTriangle,
  BarChart3, ArrowRight, Fingerprint, Brain, CheckCircle2,
  Database, Activity, ChevronRight, Loader2,
} from 'lucide-react';
import { getTopSuspects, getExecutiveSummary, getMajorEntities, getDashboardMetrics } from '../../services/apiClient';
import type { SuspectProfile, ApiGraphResponse, MajorEntitiesResponse, DashboardMetricsResponse } from '../../services/apiClient';
import { useCaseData } from '../../context/CaseDataContext';
import { computeChunkCounts } from '../../services/documentProcessor';

const CaseOverviewPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { getChunks, getAlerts, getDocuments } = useCaseData();

  // Local processed data (from uploaded .txt files)
  const localChunks = caseId ? getChunks(caseId) : [];
  const localAlerts = caseId ? getAlerts(caseId) : [];
  const localDocs   = caseId ? getDocuments(caseId) : [];
  const localCounts = computeChunkCounts(localChunks);

  // Create a default case data structure since the backend doesn't provide metadata yet
  const caseData = {
    id: caseId ?? 'UNKNOWN',
    name: caseId ?? 'Unknown Case',
    type: 'INVESTIGATION',
    status: 'ACTIVE',
    priority: 'HIGH',
    investigatingOfficer: 'Unassigned',
    description: `Analysis for case: ${caseId}. Documents have been processed and integrated into the global knowledge graph.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    personsOfInterestCount: 0,
    evidenceCount: 0,
    entityCount: 0,
    relationshipCount: 0,
    networkSize: 0,
    tags: ['dynamic-case'],
    extractionStatus: 'COMPLETED',
    documentCount: 0,
    chunkCounts: {
      total: 0, fir: 0, cdr: 0, financial: 0, surveillance: 0, intelligence: 0, criminalHistory: 0, socialIntelligence: 0
    }
  };

  // ── Live suspects from backend ──────────────────────────
  const [liveSuspects, setLiveSuspects] = useState<SuspectProfile[] | null>(null);
  const [suspectsLoading, setSuspectsLoading] = useState(true);
  const [suspectsLive, setSuspectsLive] = useState(false);

  // ── Metrics from backend ────────────────────────────────
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);


  useEffect(() => {
    if (!caseId) return;
    setSuspectsLoading(true);
    getTopSuspects(caseId, 5)
      .then((data) => {
        setLiveSuspects(data);
        setSuspectsLive(true);
      })
      .catch(() => {
        setLiveSuspects(null);
        setSuspectsLive(false);
      })
      .finally(() => setSuspectsLoading(false));

    setMetricsLoading(true);
    getDashboardMetrics(caseId)
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setMetricsLoading(false));

    setExecLoading(true);
    getExecutiveSummary(caseId, 20, 6, 1)
      .then(setExecSummary)
      .catch(() => setExecSummary(null))
      .finally(() => setExecLoading(false));

    setEntitiesLoading(true);
    getMajorEntities(caseId, 50)
      .then(setMajorEntities)
      .catch(() => setMajorEntities(null))
      .finally(() => setEntitiesLoading(false));
  }, [caseId]);

  // ── Executive Summary & Major Entities ──
  const [execSummary, setExecSummary] = useState<ApiGraphResponse | null>(null);
  const [execLoading, setExecLoading] = useState(true);

  const [majorEntities, setMajorEntities] = useState<MajorEntitiesResponse | null>(null);
  const [entitiesLoading, setEntitiesLoading] = useState(true);


  if (!caseData) {
    return (
      <div style={{ padding: '32px' }}>
        <div className="section-header" style={{ color: 'var(--critical)' }}>CASE NOT FOUND</div>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', marginTop: '8px' }}>
          Case ID "{caseId}" does not exist in the database.
        </p>
        <button className="btn btn--ghost" style={{ marginTop: '16px' }} onClick={() => navigate('/cases')}>
          ← RETURN TO CASES
        </button>
      </div>
    );
  }

  const docs: any[] = [];
  const chunks: any[] = [];
  const nodes: any[] = [];
  const caseAlerts: any[] = [];
  const base = `/cases/${caseId}`;

  const priorityColor = caseData.priority === 'CRITICAL' ? 'var(--critical)'
    : caseData.priority === 'HIGH' ? 'var(--accent)'
    : caseData.priority === 'MEDIUM' ? 'var(--accent-dim)'
    : 'var(--text-muted)';

  const statusColor = caseData.status === 'ACTIVE' ? 'var(--operational)'
    : caseData.status === 'UNDER_REVIEW' ? 'var(--warning)'
    : 'var(--text-muted)';

  const cc = caseData.chunkCounts;

  const isCompleted = caseData.extractionStatus === 'COMPLETED';

  const processingSteps = [
    { label: 'DOCUMENT UPLOADED', done: true },
    { label: 'DOCUMENT PARSED', done: true },
    { label: 'CHUNKS EXTRACTED', done: caseData.extractionStatus !== 'NOT_STARTED' && caseData.extractionStatus !== 'UPLOADED' },
    { label: 'CHUNKS CLASSIFIED', done: caseData.extractionStatus === 'COMPLETED' || caseData.extractionStatus === 'EXTRACTING_ENTITIES' || caseData.extractionStatus === 'BUILDING_GRAPH' },
    { label: 'ENTITIES EXTRACTED', done: caseData.extractionStatus === 'COMPLETED' || caseData.extractionStatus === 'BUILDING_GRAPH' },
    { label: 'GRAPH BUILT', done: caseData.extractionStatus === 'COMPLETED' },
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1200px' }}>
      {/* ── Case Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '4px' }}>
              {caseData.id} // {caseData.type.replace(/_/g, ' ')}
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {caseData.name}
            </h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`badge badge--${caseData.status === 'ACTIVE' ? 'active' : caseData.status === 'UNDER_REVIEW' ? 'review' : 'closed'}`}>
                {caseData.status.replace('_', ' ')}
              </span>
              <span className={`badge badge--${caseData.priority === 'CRITICAL' ? 'critical' : caseData.priority === 'HIGH' ? 'high' : 'medium'}`}>
                {caseData.priority} PRIORITY
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                IO: {caseData.investigatingOfficer}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button className="btn btn--ghost" onClick={() => navigate(`${base}/network`)} style={{ fontSize: '0.7rem' }}>
              <Network size={12} /> NETWORK GRAPH
            </button>
            <button className="btn btn--ghost" onClick={() => navigate(`${base}/hypergraph`)} style={{ fontSize: '0.7rem', color: '#9B59B6', borderColor: 'rgba(155, 89, 182, 0.3)' }}>
              <Network size={12} /> HYPERGRAPH VIEW
            </button>
            <button className="btn btn--accent" onClick={() => navigate(`${base}/investigations/known-suspect`)} style={{ fontSize: '0.7rem' }}>
              <Fingerprint size={12} /> INVESTIGATE
            </button>
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6, margin: '12px 0 0', maxWidth: '800px' }}>
          {caseData.description}
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1px', marginBottom: '24px' }}>
        {[
          { label: 'DOCUMENTS',     value: metrics?.documents    || localDocs.length,          icon: FileText },
          { label: 'CHUNKS',        value: metrics?.chunks        || localCounts.total,          icon: Database },
          { label: 'ENTITIES',      value: (metrics?.entities ?? 0).toLocaleString(),             icon: Network },
          { label: 'PERSONS',       value: metrics?.persons ?? 0,                                 icon: Users },
          { label: 'EVIDENCE',      value: metrics?.evidence ?? 0,                                icon: Shield },
          { label: 'RELATIONSHIPS', value: (metrics?.relationships ?? 0).toLocaleString(),         icon: Activity },
          { label: 'ALERTS',        value: metrics?.alerts        || localAlerts.length,           icon: AlertTriangle },
          { label: 'NETWORK SIZE',  value: metrics?.network_size ?? 0,                            icon: BarChart3 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
              <Icon size={10} style={{ color: 'var(--accent-dim)' }} />
              <span className="intel-label" style={{ fontSize: '0.58rem' }}>{label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1 }}>
              {metricsLoading ? (
                <Loader2 size={16} className="spin" style={{ color: 'var(--text-secondary)' }} />
              ) : (
                value
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* Extraction Pipeline Status */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div className="section-header">DATA EXTRACTION STATUS</div>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem', padding: '2px 8px',
              background: isCompleted ? 'var(--operational-soft)' : 'var(--accent-faint)',
              border: `1px solid ${isCompleted ? 'var(--operational)' : 'var(--accent-dim)'}`,
              color: isCompleted ? '#6A9E6A' : 'var(--accent)',
            }}>
              {caseData.extractionStatus.replace(/_/g, ' ')}
            </span>
          </div>

          {processingSteps.map(({ label, done }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--border-faint)' }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: done ? 'var(--operational-soft)' : 'var(--bg-elevated)',
                border: `1px solid ${done ? 'var(--operational)' : 'var(--border-base)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {done ? (
                  <span style={{ color: '#6A9E6A', fontSize: '0.6rem' }}>✓</span>
                ) : (
                  <span style={{ color: 'var(--text-faint)', fontSize: '0.55rem' }}>○</span>
                )}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: done ? 'var(--text-secondary)' : 'var(--text-faint)', letterSpacing: '0.08em' }}>
                {label}
              </span>
            </div>
          ))}

          {isCompleted && cc && (
            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-base)' }}>
              <div className="intel-label" style={{ marginBottom: '8px' }}>CHUNK DISTRIBUTION</div>
              {[
                { label: 'FIR', value: cc.fir, total: cc.total },
                { label: 'CDR', value: cc.cdr, total: cc.total },
                { label: 'FINANCIAL', value: cc.financial, total: cc.total },
                { label: 'SURVEILLANCE', value: cc.surveillance, total: cc.total },
                { label: 'INTELLIGENCE', value: cc.intelligence, total: cc.total },
                { label: 'CRIMINAL HISTORY', value: cc.criminalHistory, total: cc.total },
                { label: 'SOCIAL INTEL.', value: cc.socialIntelligence, total: cc.total },
              ].map(({ label, value, total }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', width: '110px', flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, height: '3px', background: 'var(--border-dim)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(value / total) * 100}%`, background: 'var(--accent)', opacity: 0.7 }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', width: '28px', textAlign: 'right', flexShrink: 0 }}>{value}</span>
                </div>
              ))}
              <button
                className="btn btn--ghost"
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px', fontSize: '0.68rem' }}
                onClick={() => navigate(`${base}/chunks`)}
              >
                VIEW ALL CHUNKS <ArrowRight size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Case Documents + Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Documents */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="section-header">SOURCE DOCUMENTS</div>
              <button
                className="btn btn--ghost"
                style={{ fontSize: '0.65rem', padding: '5px 10px' }}
                onClick={() => navigate(`${base}/data`)}
              >
                VIEW ALL
              </button>
            </div>
            {docs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '12px 0', textAlign: 'center' }}>
                NO DOCUMENTS UPLOADED
              </div>
            ) : (
              docs.map((doc) => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border-faint)' }}>
                  <FileText size={12} style={{ color: 'var(--accent-dim)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.fileName}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                      {doc.chunkCount} chunks · {(doc.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.58rem', padding: '2px 6px',
                    background: doc.status === 'PROCESSED' ? 'var(--operational-soft)' : 'var(--accent-faint)',
                    border: `1px solid ${doc.status === 'PROCESSED' ? 'var(--operational)' : 'var(--accent-dim)'}`,
                    color: doc.status === 'PROCESSED' ? '#6A9E6A' : 'var(--accent)',
                    flexShrink: 0,
                  }}>
                    {doc.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Quick links / Investigation modes */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px' }}>
            <div className="section-header" style={{ marginBottom: '12px' }}>INVESTIGATION MODES</div>
            {[
              { icon: Fingerprint, badge: 'MODE 01', title: 'KNOWN SUSPECT', desc: 'Expand a known person\'s network', path: `${base}/investigations/known-suspect` },
              { icon: Brain, badge: 'MODE 02', title: 'UNKNOWN SUSPECT', desc: 'Identify investigation candidates', path: `${base}/investigations/unknown-suspect` },
            ].map(({ icon: Icon, badge, title, desc, path }) => (
              <div
                key={title}
                onClick={() => navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-base)',
                  cursor: 'pointer', marginBottom: '6px', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-dim)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-faint)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-base)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              >
                <Icon size={14} style={{ color: 'var(--accent-dim)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-primary)', letterSpacing: '0.06em' }}>{title}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
                <ArrowRight size={12} style={{ color: 'var(--accent-dim)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Top Suspects (Live) ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="section-header">TOP SUSPECTS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {suspectsLive
                ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#6A9E6A', padding: '2px 6px', border: '1px solid var(--operational)', background: 'rgba(58,94,58,0.12)' }}><Database size={9} style={{ display: 'inline', marginRight: '3px' }} />LIVE</span>
                : <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-faint)', padding: '2px 6px', border: '1px solid var(--border-dim)' }}>OFFLINE</span>
              }
              <button className="btn btn--ghost" style={{ fontSize: '0.65rem', padding: '5px 10px' }} onClick={() => navigate(`${base}/network`)}>
                GRAPH
              </button>
              <button className="btn btn--ghost" style={{ fontSize: '0.65rem', padding: '5px 10px', color: '#9B59B6', borderColor: 'rgba(155, 89, 182, 0.3)' }} onClick={() => navigate(`${base}/hypergraph`)}>
                HYPERGRAPH
              </button>
            </div>
          </div>

          {suspectsLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
              <Loader2 size={14} className="animate-spin-slow" style={{ color: 'var(--accent)' }} />
              QUERYING NEO4J...
            </div>
          )}

          {!suspectsLoading && !suspectsLive && (
            <div style={{ padding: '10px 0', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={12} style={{ color: 'var(--warning)' }} />
              Backend offline — start FastAPI to see live suspect data
            </div>
          )}

          {!suspectsLoading && suspectsLive && liveSuspects && liveSuspects.length === 0 && (
            <div style={{ padding: '10px 0', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-faint)' }}>
              No suspects found — upload and process documents to populate the graph.
            </div>
          )}

          {!suspectsLoading && suspectsLive && liveSuspects && liveSuspects.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {liveSuspects.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-faint)', borderLeft: `2px solid ${i < 3 ? 'var(--critical)' : 'var(--accent-dim)'}` }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: i < 3 ? 'var(--critical)' : 'var(--text-faint)', width: '18px', flexShrink: 0 }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>{s.mentions} mentions · {s.degree_connections} connections</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', padding: '2px 6px', border: '1px solid var(--border-dim)', color: 'var(--text-muted)', flexShrink: 0 }}>{s.master_role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Secondary Grid (Executive Summary & Major Entities) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        
        {/* Executive Summary */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="section-header">EXECUTIVE SUMMARY</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn--ghost" style={{ fontSize: '0.65rem', padding: '5px 10px' }} onClick={() => navigate(`${base}/network`)}>
                FULL GRAPH
              </button>
              <button className="btn btn--ghost" style={{ fontSize: '0.65rem', padding: '5px 10px', color: '#9B59B6', borderColor: 'rgba(155, 89, 182, 0.3)' }} onClick={() => navigate(`${base}/hypergraph`)}>
                HYPERGRAPH
              </button>
            </div>
          </div>
          {execLoading ? (
            <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={16} className="animate-spin-slow" style={{ color: 'var(--accent)' }} />
            </div>
          ) : execSummary && execSummary.nodes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {execSummary.nodes.slice(0, 5).map((node) => (
                <div key={node.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-faint)', borderLeft: '2px solid var(--accent-dim)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>{node.mentions} mentions</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', padding: '2px 6px', border: '1px solid var(--border-dim)', color: 'var(--text-muted)' }}>{node.type || 'ENTITY'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '10px 0', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-faint)' }}>
              No executive summary available.
            </div>
          )}
        </div>

        {/* Major Entities */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="section-header">MAJOR ENTITIES</div>
          </div>
          {entitiesLoading ? (
            <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={16} className="animate-spin-slow" style={{ color: 'var(--accent)' }} />
            </div>
          ) : majorEntities && (majorEntities.people.length > 0 || majorEntities.organizations.length > 0) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[...majorEntities.organizations, ...majorEntities.people].slice(0, 5).map((ent) => (
                <div key={ent.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-faint)' }}>
                  <Users size={14} style={{ color: 'var(--accent-dim)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ent.name}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)', flexShrink: 0 }}>{ent.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '10px 0', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-faint)' }}>
              No major entities identified yet.
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Alerts ── */}
      {caseAlerts.length > 0 && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="section-header">CASE ALERTS</div>
            <button className="btn btn--ghost" style={{ fontSize: '0.65rem', padding: '5px 10px' }} onClick={() => navigate(`${base}/alerts`)}>
              VIEW ALL
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {caseAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-faint)',
                  borderLeft: `2px solid ${alert.severity === 'HIGH' ? 'var(--critical)' : alert.severity === 'MEDIUM' ? 'var(--accent-dim)' : 'var(--border-base)'}`,
                }}
              >
                <AlertTriangle size={12} style={{ color: alert.severity === 'HIGH' ? 'var(--critical)' : 'var(--accent-dim)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>{alert.title}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{alert.category} · {new Date(alert.detectedAt).toLocaleDateString('en-IN')}</div>
                </div>
                <span className={`badge badge--${alert.severity === 'HIGH' ? 'critical' : 'medium'}`}>{alert.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="intel-label">TAGS:</span>
        {caseData.tags.map((tag) => (
          <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', padding: '2px 8px', border: '1px solid var(--border-dim)', letterSpacing: '0.08em' }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '20px', padding: '10px 0', borderTop: '1px solid var(--border-faint)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="intel-label">CREATED {new Date(caseData.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <span className="intel-label">LAST UPDATED {new Date(caseData.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      </div>
    </div>
  );
};

export default CaseOverviewPage;
