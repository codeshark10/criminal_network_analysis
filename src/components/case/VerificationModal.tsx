import React from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { CaseVerificationResponse } from '../../services/apiClient';

interface VerificationModalProps {
  onClose: () => void;
  result: CaseVerificationResponse | null;
  loading: boolean;
  error: string | null;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ onClose, result, loading, error }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '500px',
          maxWidth: '90vw',
          background: 'var(--bg-void)',
          border: '1px solid var(--border-dim)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-base)', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="intel-label" style={{ color: 'var(--accent)' }}>SYSTEM VERIFICATION</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div className="animate-pulse-accent" style={{ width: '20px', height: '20px', background: 'var(--accent)', borderRadius: '50%', margin: '0 auto 16px' }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>VERIFYING BLOCKCHAIN INTEGRITY...</div>
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: '16px', border: '1px solid var(--critical)', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--critical)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>VERIFICATION FAILED</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{error}</div>
              </div>
            </div>
          )}

          {result && !loading && !error && (
            <>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: '24px', 
                background: result.overall_valid ? 'var(--operational-soft)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${result.overall_valid ? 'var(--operational)' : 'var(--critical)'}`,
                textAlign: 'center',
                gap: '12px'
              }}>
                {result.overall_valid ? (
                  <ShieldCheck size={48} color="var(--operational)" />
                ) : (
                  <ShieldAlert size={48} color="var(--critical)" />
                )}
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: result.overall_valid ? 'var(--operational)' : 'var(--critical)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    {result.overall_valid ? 'INTEGRITY VERIFIED' : 'INTEGRITY COMPROMISED'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Case ID: <span style={{ fontFamily: 'var(--font-mono)' }}>{result.case_id}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="intel-label" style={{ marginBottom: '12px' }}>FILE VERIFICATION RESULTS ({result.total_files_checked})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {result.results.map((res, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        {res.is_valid ? <CheckCircle size={14} color="var(--operational)" /> : <AlertTriangle size={14} color="var(--critical)" />}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {res.original_file}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: res.is_valid ? 'var(--text-secondary)' : 'var(--critical)' }}>
                        {res.message}
                      </span>
                    </div>
                  ))}
                  {result.results.length === 0 && (
                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      No files available for verification.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-base)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn" style={{ background: 'var(--bg-surface)' }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
