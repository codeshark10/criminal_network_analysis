// ============================================================
// NEXUS — Analysis Animation Component
// Multi-step animated investigation sequence
// ============================================================

import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader } from 'lucide-react';
import type { AnalysisStep } from '../../services/investigationEngine';

interface AnalysisAnimationProps {
  steps: AnalysisStep[];
  onComplete: () => void;
  title?: string;
}

const AnalysisAnimation: React.FC<AnalysisAnimationProps> = ({ steps, onComplete, title = 'ANALYSIS ENGINE' }) => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let totalDelay = 400;
    steps.forEach((step, i) => {
      // Start step
      setTimeout(() => setCurrentStep(i), totalDelay);
      totalDelay += step.durationMs;
      // Complete step
      const completeDelay = totalDelay;
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, i]);
        if (i === steps.length - 1) {
          setTimeout(() => { setDone(true); setTimeout(onComplete, 800); }, 300);
        }
      }, completeDelay);
      totalDelay += 200;
    });
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
        minHeight: '400px',
      }}
    >
      {/* Title */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div className="section-header" style={{ marginBottom: '6px' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
          SYNTHETIC DEMONSTRATION // AI-ASSISTED ANALYSIS
        </div>
      </div>

      {/* Steps */}
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {steps.map((step, i) => {
          const isActive = currentStep === i && !completedSteps.includes(i);
          const isComplete = completedSteps.includes(i);
          const isPending = currentStep < i;

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                background: isActive ? 'var(--accent-faint)' : isComplete ? 'var(--bg-surface)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--accent-dim)' : isComplete ? 'var(--border-dim)' : 'transparent'}`,
                transition: 'all 0.3s',
                opacity: isPending ? 0.25 : 1,
              }}
            >
              {/* Icon */}
              <div style={{ flexShrink: 0, width: '16px', display: 'flex', justifyContent: 'center' }}>
                {isComplete ? (
                  <CheckCircle size={14} style={{ color: 'var(--accent)' }} />
                ) : isActive ? (
                  <Loader size={14} style={{ color: 'var(--accent)', animation: 'spin-slow 1.5s linear infinite' }} />
                ) : (
                  <div style={{ width: '6px', height: '6px', border: '1px solid var(--border-base)', borderRadius: '50%' }} />
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: isComplete ? 'var(--text-secondary)' : isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  letterSpacing: '0.05em',
                }}>
                  {step.label}
                </div>
                {isComplete && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--accent)', marginTop: '2px' }}>
                    ✓ {step.detail}
                  </div>
                )}
                {isActive && (
                  <div style={{ height: '2px', background: 'var(--border-dim)', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--accent)', animation: 'progress-fill 0.8s ease-out forwards', animationDuration: `${step.durationMs * 0.9}ms` }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete */}
      {done && (
        <div
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: 'var(--accent-faint)',
            border: '1px solid var(--accent-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--accent)',
            letterSpacing: '0.12em',
            animation: 'fade-in-up 0.4s ease-out',
          }}
        >
          ✓ ANALYSIS COMPLETE
        </div>
      )}
    </div>
  );
};

export default AnalysisAnimation;
