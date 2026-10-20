import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, AlertTriangle, Link as LinkIcon, DollarSign, BrainCircuit, Activity, 
  ArrowLeft, ExternalLink, User, Building2, MapPin, FileText, Landmark, Database, ShieldAlert, Zap
} from 'lucide-react';
import { getNodeProfile } from '../../services/apiClient';
import type { NodeProfileResponse, NodeProfileConnection } from '../../services/apiClient';

const NodeProfilePage: React.FC = () => {
  const { caseId, nodeId } = useParams<{ caseId: string; nodeId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<NodeProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      if (!caseId || !nodeId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getNodeProfile(caseId, nodeId);
        if (active) setProfile(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProfile();
    return () => active = false;
  }, [caseId, nodeId]);

  const groupedConnections = useMemo(() => {
    if (!profile?.connections) return {};
    return profile.connections.reduce((acc, conn) => {
      if (!acc[conn.relationship_type]) acc[conn.relationship_type] = [];
      acc[conn.relationship_type].push(conn);
      return acc;
    }, {} as Record<string, NodeProfileConnection[]>);
  }, [profile]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-app)' }}>
        <Loader2 size={40} className="animate-spin-slow" style={{ color: 'var(--accent)', marginBottom: '16px' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
          ASSEMBLING INTELLIGENCE DOSSIER...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', background: 'var(--bg-app)' }}>
        <AlertTriangle size={56} style={{ color: 'var(--warning)', marginBottom: '16px' }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--warning)', letterSpacing: '0.06em', marginBottom: '12px' }}>
          ACCESS DENIED OR PROFILE NOT FOUND
        </div>
        <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{error || 'The requested entity could not be located in the database.'}</div>
        <button className="btn btn--ghost" style={{ marginTop: '24px' }} onClick={() => navigate(-1)}>RETURN TO PREVIOUS</button>
      </div>
    );
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  
  const riskScore = profile.properties?.risk_score !== undefined ? Number(profile.properties.risk_score) : null;
  const isHighRisk = riskScore !== null && riskScore >= 75;
  
  const aiConnectionsCount = profile.connections?.filter(c => c.relationship_type.includes('INFERRED') || c.relationship_type.includes('PREDICTED')).length || 0;
  const knownConnectionsCount = (profile.connections?.length || 0) - aiConnectionsCount;

  const getIconForType = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PERSON': return <User size={42} />;
      case 'ORGANIZATION':
      case 'COMPANY': return <Building2 size={42} />;
      case 'BANK':
      case 'BANK_ACCOUNT': return <Landmark size={42} />;
      case 'LOCATION': return <MapPin size={42} />;
      case 'DOCUMENT': return <FileText size={42} />;
      default: return <Database size={42} />;
    }
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', 
      background: 'var(--bg-app)', color: 'var(--text-primary)'
    }}>
      
      {/* Top Navigation Bar */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 10, background: 'rgba(10, 10, 10, 0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-dim)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <button 
          className="btn btn--ghost" 
          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          onClick={() => navigate(`/cases/${caseId}/network`)}
        >
          <ArrowLeft size={16} style={{ marginRight: '8px' }} /> RETURN TO NETWORK GRAPH
        </button>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          CASE ID: {caseId} • ENTITY PROFILE
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* Entity Hero Header */}
        <div style={{ 
          display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '32px', 
          background: isHighRisk ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(0,0,0,0) 100%)' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(0,0,0,0) 100%)',
          border: '1px solid var(--border-dim)', borderRadius: '12px', padding: '32px',
          position: 'relative', overflow: 'hidden'
        }}>
          {isHighRisk && (
            <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239,68,68,0.15)', color: 'var(--warning)', padding: '6px 16px', borderBottomLeftRadius: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={12} /> HIGH RISK ENTITY
            </div>
          )}
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: isHighRisk ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', 
            color: isHighRisk ? 'var(--warning)' : 'var(--accent)',
            border: `1px solid ${isHighRisk ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`
          }}>
            {getIconForType(profile.type)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {profile.name}
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
              <span style={{ 
                padding: '4px 10px', borderRadius: '4px', background: 'var(--bg-raised)', 
                border: '1px solid var(--border-faint)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)'
              }}>
                {profile.type.replace(/_/g, ' ')}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ID: {profile.id}
              </span>
            </div>
          </div>
        </div>

        {/* Key Intelligence Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {riskScore !== null && (
            <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-dim)', borderTop: `3px solid ${isHighRisk ? 'var(--warning)' : 'var(--accent)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <Activity size={16} /> <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>RISK SCORE</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: isHighRisk ? 'var(--warning)' : 'var(--text-primary)' }}>
                {riskScore.toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--text-faint)' }}>/100</span>
              </div>
            </div>
          )}
          
          {(profile.total_funds_transferred || 0) > 0 && (
            <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-dim)', borderTop: '3px solid var(--graph-financial)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <DollarSign size={16} /> <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>TOTAL TRANSFERRED</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--graph-financial)' }}>
                {formatCurrency(profile.total_funds_transferred || 0)}
              </div>
            </div>
          )}

          <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-dim)', borderTop: '3px solid var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <LinkIcon size={16} /> <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>DOCUMENTED LINKS</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {knownConnectionsCount}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.3)', borderTop: '3px solid #a855f7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d8b4fe', marginBottom: '8px' }}>
              <BrainCircuit size={16} /> <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>AI PREDICTIONS</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: '#e9d5ff' }}>
              {aiConnectionsCount}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
          
          {/* Left Column: Metadata & Centrality */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-dim)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-dim)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="var(--text-muted)" />
                <h3 style={{ margin: 0, fontSize: '0.85rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>ENTITY DOSSIER</h3>
              </div>
              <div style={{ padding: '8px 0' }}>
                {Object.entries(profile.properties || {})
                  .filter(([k, v]) => k !== 'risk_score' && v !== null && v !== '')
                  .map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', padding: '10px 20px', borderBottom: '1px solid var(--border-faint)' }}>
                      <span style={{ width: '40%', flexShrink: 0, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {k.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.85rem', flex: 1, wordBreak: 'break-word', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                ))}
              </div>
            </div>

            {profile.centralities && Object.values(profile.centralities).some(v => v !== undefined) && (
              <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-dim)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-dim)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color="var(--text-muted)" />
                  <h3 style={{ margin: 0, fontSize: '0.85rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>NETWORK IMPORTANCE</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border-faint)' }}>
                  {[
                    { label: 'DEGREE', value: profile.centralities.degree, desc: 'Direct links' },
                    { label: 'BETWEENNESS', value: profile.centralities.betweenness, desc: 'Information broker' },
                    { label: 'CLOSENESS', value: profile.centralities.closeness, desc: 'Reachability' },
                    { label: 'PAGERANK', value: profile.centralities.pagerank, desc: 'Influence' },
                  ].map(({ label, value, desc }) => value !== undefined ? (
                    <div key={label} style={{ background: 'var(--bg-surface)', padding: '16px' }}>
                      <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '2px' }}>
                        {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(4) : value}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>{desc}</div>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Connections (Separated into Tabs or Sections) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-dim)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 500 }}>Entity Connections</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{profile.connections?.length || 0} Total Edges</div>
            </div>

            {Object.keys(groupedConnections).length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-faint)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-dim)' }}>
                No documented or inferred connections found for this entity.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {Object.entries(groupedConnections).sort(([a], [b]) => {
                  // Push AI connections to the top for visibility
                  const aIsAI = a.includes('INFERRED') || a.includes('PREDICTED');
                  const bIsAI = b.includes('INFERRED') || b.includes('PREDICTED');
                  if (aIsAI && !bIsAI) return -1;
                  if (!aIsAI && bIsAI) return 1;
                  return a.localeCompare(b);
                }).map(([relType, conns]) => {
                  const isAI = relType.includes('INFERRED') || relType.includes('PREDICTED');
                  
                  return (
                    <div key={relType}>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'
                      }}>
                        <div style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '6px',
                          background: isAI ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.05)', 
                          color: isAI ? '#d8b4fe' : 'var(--text-secondary)', 
                          fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600,
                          border: `1px solid ${isAI ? 'rgba(168, 85, 247, 0.3)' : 'var(--border-dim)'}`
                        }}>
                          {isAI ? <BrainCircuit size={14} /> : <LinkIcon size={14} />}
                          {relType}
                        </div>
                        <div style={{ flex: 1, height: '1px', background: isAI ? 'rgba(168, 85, 247, 0.2)' : 'var(--border-dim)' }} />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{conns.length} records</div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {conns.map((conn, idx) => (
                          <div 
                            key={`${conn.target_id}-${idx}`} 
                            style={{ 
                              background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', 
                              border: `1px solid ${isAI ? 'rgba(168, 85, 247, 0.3)' : 'var(--border-dim)'}`, 
                              cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', position: 'relative',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.borderColor = isAI ? '#a855f7' : 'var(--accent-dim)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.borderColor = isAI ? 'rgba(168, 85, 247, 0.3)' : 'var(--border-dim)';
                            }}
                            onClick={() => navigate(`/cases/${caseId}/nodes/${conn.target_id}/profile`)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600, paddingRight: '12px' }}>
                                {conn.target_name || conn.target_id}
                              </div>
                              <ExternalLink size={16} style={{ color: 'var(--text-faint)' }} />
                            </div>
                            
                            {conn.properties && Object.keys(conn.properties).length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border-faint)' }}>
                                {conn.properties.amount_inr !== undefined && (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>AMOUNT</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--graph-financial)', fontWeight: 600 }}>
                                      {formatCurrency(conn.properties.amount_inr)}
                                    </span>
                                  </div>
                                )}
                                {conn.properties.date !== undefined && (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>DATE</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                      {conn.properties.date}
                                    </span>
                                  </div>
                                )}
                                {conn.properties.ai_confidence_score !== undefined && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#d8b4fe' }}>AI CONFIDENCE</span>
                                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#e9d5ff', fontWeight: 600 }}>
                                        {Math.round(Number(conn.properties.ai_confidence_score) * 100)}%
                                      </span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '2px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${Number(conn.properties.ai_confidence_score) * 100}%`, background: '#a855f7' }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeProfilePage;
