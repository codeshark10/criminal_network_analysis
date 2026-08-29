import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HypergraphViewer from '../components/graph/HypergraphViewer';
import { ArrowLeft, X } from 'lucide-react';

interface BipartiteNode {
  id: string;
  label: string;
  type: 'EVENT' | 'PARTICIPANT';
  eventType?: string;
}

const HypergraphPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<BipartiteNode | null>(null);

  if (!caseId) {
    return (
      <div style={{ padding: '24px', color: 'var(--critical)' }}>
        NO CASE SELECTED
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '12px 24px', 
        borderBottom: '1px solid var(--border-dim)',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn btn--ghost" 
            onClick={() => navigate(-1)}
            style={{ padding: '6px' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 300, color: 'var(--text-primary)' }}>
              Hypergraph Analysis
            </h1>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              BIPARTITE MULTI-ENTITY EVENT VISUALIZATION
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <HypergraphViewer 
            caseId={caseId} 
            onNodeSelect={(node) => setSelectedNode(node)}
            selectedNodeId={selectedNode?.id}
          />
        </div>

        {/* Right Sidebar */}
        <div style={{
          width: selectedNode ? '280px' : '0',
          transition: 'width 0.25s ease',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-dim)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div style={{ width: '280px', height: '100%', overflowY: 'auto', padding: '14px' }}>
            {selectedNode && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div className="section-header">{selectedNode.type}</div>
                  <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={14} />
                  </button>
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '16px' }}>
                  {selectedNode.type === 'EVENT' ? selectedNode.eventType || selectedNode.id : selectedNode.label}
                </div>
                <div className="intel-label" style={{ marginBottom: '6px' }}>PROPERTIES</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="data-key">ID</span>
                  <span className="data-value" style={{ fontSize: '0.65rem', textAlign: 'right', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedNode.id}
                  </span>
                </div>
                {selectedNode.type === 'EVENT' && selectedNode.eventType && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="data-key">EVENT TYPE</span>
                    <span className="data-value" style={{ fontSize: '0.65rem', textAlign: 'right' }}>
                      {selectedNode.eventType}
                    </span>
                  </div>
                )}
                <div className="divider" style={{ margin: '16px 0' }} />
                <button
                  className="btn btn--ghost"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    // Try to navigate to person profile if it looks like a participant, or back to network
                    if (selectedNode.type === 'PARTICIPANT') {
                      navigate(`/cases/${caseId}/persons/${selectedNode.id}`);
                    } else {
                      navigate(`/cases/${caseId}/network`);
                    }
                  }}
                >
                  {selectedNode.type === 'PARTICIPANT' ? 'VIEW PROFILE' : 'VIEW IN NETWORK'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HypergraphPage;
