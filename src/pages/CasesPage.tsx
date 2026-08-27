// ============================================================
// NEXUS — Cases Page
// SIH26189 | Active + Past + Create New Case
// New: Single-document upload pipeline workflow
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, FolderOpen, Archive, Clock, ChevronRight, X, ArrowRight, Upload, FileText, CheckCircle2, Loader2, Network, Database, User } from 'lucide-react';
import { getCases, uploadCaseDocuments } from '../services/apiClient';
import type { UploadCasesResponse, CaseItem } from '../services/apiClient';
import { useCaseData } from '../context/CaseDataContext';
import { computeChunkCounts } from '../services/documentProcessor';

// ── Processing Animation ───────────────────────────────────────
const PROCESSING_STAGES = [
  { id: 'parse',    label: 'Document Parsing',       detail: 'Extracting raw text and structure from PDF...', duration: 1800 },
  { id: 'chunk',    label: 'Chunk Extraction',        detail: 'Segmenting document into intelligence units...', duration: 2400 },
  { id: 'classify', label: 'Chunk Classification',    detail: 'Categorizing chunks: FIR / CDR / Financial / Surveillance...', duration: 2200 },
  { id: 'entity',   label: 'Entity Extraction',       detail: 'Identifying persons, organizations, locations, accounts...', duration: 2800 },
  { id: 'rel',      label: 'Relationship Extraction', detail: 'Mapping connections between extracted entities...', duration: 2600 },
  { id: 'graph',    label: 'Knowledge Graph Build',   detail: 'Constructing Neo4j-compatible investigation graph...', duration: 2000 },
];

const ProcessingStages: React.FC<{ fileName: string; onComplete: () => void }> = ({ fileName, onComplete }) => {
  const [stageIdx, setStageIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (stageIdx >= PROCESSING_STAGES.length) { setDone(true); return; }
    const timer = setTimeout(() => setStageIdx((i) => i + 1), PROCESSING_STAGES[stageIdx].duration);
    return () => clearTimeout(timer);
  }, [stageIdx]);

  useEffect(() => {
    if (done) { const t = setTimeout(onComplete, 800); return () => clearTimeout(t); }
  }, [done, onComplete]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-base)' }}>
        <FileText size={14} style={{ color: 'var(--accent-dim)' }} />
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>{fileName}</div>
          <div className="intel-label" style={{ fontSize: '0.58rem' }}>PROCESSING THROUGH AI EXTRACTION PIPELINE</div>
        </div>
      </div>

      {PROCESSING_STAGES.map((stage, i) => {
        const isDone = i < stageIdx;
        const isActive = i === stageIdx;
        const isWaiting = i > stageIdx;
        return (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--border-faint)' }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
              background: isDone ? 'var(--operational-soft)' : isActive ? 'var(--accent-faint)' : 'var(--bg-elevated)',
              border: `1px solid ${isDone ? 'var(--operational)' : isActive ? 'var(--accent-dim)' : 'var(--border-base)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: '1px',
            }}>
              {isDone && <span style={{ color: '#6A9E6A', fontSize: '0.65rem' }}>✓</span>}
              {isActive && <span className="animate-pulse-accent" style={{ display: 'block', width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%' }} />}
              {isWaiting && <span style={{ color: 'var(--text-faint)', fontSize: '0.55rem' }}>{i + 1}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.08em', color: isDone ? 'var(--text-secondary)' : isActive ? 'var(--accent)' : 'var(--text-faint)', marginBottom: '2px' }}>
                {stage.label}
              </div>
              {isActive && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }} className="animate-data-flicker">
                  {stage.detail}
                </div>
              )}
              {isDone && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                  {stage.id === 'chunk' && ['FIR ×24', 'CDR ×87', 'Financial ×42', 'Surveillance ×31', '+more'].map((t) => (
                    <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--accent-dim)', background: 'var(--bg-elevated)', padding: '1px 5px', border: '1px solid var(--border-dim)' }}>{t}</span>
                  ))}
                  {stage.id === 'entity' && ['17 Persons', '8 Orgs', '13 Locations', '15 Phones', '11 Vehicles', '15 Accounts'].map((t) => (
                    <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--accent-dim)', background: 'var(--bg-elevated)', padding: '1px 5px', border: '1px solid var(--border-dim)' }}>{t}</span>
                  ))}
                  {stage.id === 'graph' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#6A9E6A' }}>687 nodes · 1,492 relationships built</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {done && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--operational-soft)', border: '1px solid var(--operational)', display: 'flex', alignItems: 'center', gap: '10px' }} className="animate-fade-in-up">
          <CheckCircle2 size={16} style={{ color: '#6A9E6A' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#6A9E6A', letterSpacing: '0.08em' }}>EXTRACTION PIPELINE COMPLETE</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Document text processed · Knowledge graph queued</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Extraction Results Summary ─────────────────────────────────
const ExtractionResults: React.FC = () => (
  <div>
    <div className="intel-label" style={{ marginBottom: '14px' }}>EXTRACTION COMPLETE — CASE INTELLIGENCE SUMMARY</div>

    {/* Chunk distribution */}
    <div style={{ marginBottom: '16px' }}>
      <div className="intel-label" style={{ marginBottom: '8px', fontSize: '0.6rem' }}>CHUNK DISTRIBUTION (243 TOTAL)</div>
      {[
        { cat: 'CDR',              value: 87,  color: '#7090C0', pct: 36 },
        { cat: 'FIR',              value: 24,  color: '#C07070', pct: 10 },
        { cat: 'FINANCIAL',        value: 42,  color: '#C9B86A', pct: 17 },
        { cat: 'SURVEILLANCE',     value: 31,  color: '#80B060', pct: 13 },
        { cat: 'INTELLIGENCE',     value: 18,  color: '#B08060', pct:  7 },
        { cat: 'CRIM. HISTORY',    value: 12,  color: '#9070B0', pct:  5 },
        { cat: 'SOCIAL INTEL.',    value: 29,  color: '#60A0A0', pct: 12 },
      ].map(({ cat, value, color, pct }) => (
        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--text-muted)', width: '100px', flexShrink: 0 }}>{cat}</span>
          <div style={{ flex: 1, height: '4px', background: 'var(--border-dim)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, opacity: 0.8 }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', width: '30px', textAlign: 'right' }}>{value}</span>
        </div>
      ))}
    </div>

    {/* Entity counts */}
    <div style={{ marginBottom: '12px' }}>
      <div className="intel-label" style={{ marginBottom: '8px', fontSize: '0.6rem' }}>ENTITIES EXTRACTED</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {[
          { label: 'Persons',       value: 17,  icon: User },
          { label: 'Organizations', value: 8,   icon: Network },
          { label: 'Locations',     value: 13,  icon: Network },
          { label: 'Phone Numbers', value: 15,  icon: Database },
          { label: 'Vehicles',      value: 11,  icon: Database },
          { label: 'Transactions',  value: 47,  icon: Database },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} style={{ padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-base)' }}>
            <div className="intel-label" style={{ fontSize: '0.55rem', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 300, color: 'var(--accent)', lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
      687 nodes · 1,492 relationships · Knowledge graph ready for investigation
    </div>
  </div>
);

// ── Create Case Modal ─────────────────────────────────────────
const CreateCaseModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const { processUploadedFiles } = useCaseData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', id: `CASE-2026-0${Math.floor(Math.random() * 90 + 10)}`,
    type: 'FINANCIAL_CRIME', description: '',
    priority: 'HIGH', officer: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<UploadCasesResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [processingDone, setProcessingDone] = useState(false);
  const [processedChunkCounts, setProcessedChunkCounts] = useState<ReturnType<typeof computeChunkCounts> | null>(null);

  const TOTAL_STEPS = 4;
  const stepLabels = ['CASE INFO', 'UPLOAD DOCUMENTS', 'UPLOADING', 'REVIEW & CREATE'];
  const isFormValid = form.name.trim().length > 2 && form.officer.trim().length > 1;

  // Trigger upload when arriving at step 3 (only once)
  useEffect(() => {
    if (step === 3 && !isUploading && !uploadDone && !uploadError) {
      setIsUploading(true);
      uploadCaseDocuments(form.id, uploadedFiles, true)
        .then((res) => {
          setUploadResponse(res);
          setUploadDone(true);
          // Trigger frontend processing in parallel (non-blocking for the UI flow)
          processUploadedFiles(form.id, uploadedFiles)
            .then((result) => {
              setProcessedChunkCounts(result.chunkCounts);
              setProcessingDone(true);
            })
            .catch(() => {
              // Frontend processing failed — still let user proceed
              setProcessingDone(true);
            });
        })
        .catch((err: Error) => {
          setUploadError(err.message || 'Upload failed. Please try again.');
        })
        .finally(() => {
          setIsUploading(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /** Validate and add files to state. Only .txt allowed. */
  const addFiles = (fileList: FileList | File[]) => {
    setValidationError(null);
    const valid: File[] = [];
    const rejected: string[] = [];

    Array.from(fileList).forEach((file) => {
      if (file.name.toLowerCase().endsWith('.txt')) {
        // Avoid exact duplicate filenames
        if (!uploadedFiles.some((f) => f.name === file.name && f.size === file.size)) {
          valid.push(file);
        }
      } else {
        rejected.push(file.name);
      }
    });

    if (rejected.length > 0) {
      setValidationError(
        `Only .txt files are accepted. Rejected: ${rejected.join(', ')}`
      );
    }

    if (valid.length > 0) {
      setUploadedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      // Reset input so the same file can be re-added after removal
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /** Reset upload-specific state when going back to step 2 */
  const resetUploadState = () => {
    setIsUploading(false);
    setUploadDone(false);
    setUploadError(null);
    setUploadResponse(null);
  };

  const handleCreate = () => {
    // Navigate to the dashboard where cases are re-fetched.
    setTimeout(() => { navigate('/cases'); onClose(); }, 600);
  };

  // Determines if NEXT/CREATE button should be disabled
  const isNextDisabled = (
    (step === 1 && !isFormValid) ||
    (step === 2 && uploadedFiles.length === 0) ||
    (step === 3 && (!uploadDone || !!uploadError))
  );

  // Handle footer button click
  const handleFooterAction = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleCreate();
    }
  };

  // Handle BACK button
  const handleBack = () => {
    if (step === 1) {
      onClose();
    } else if (step === 3) {
      // Going back from upload step — abort the upload conceptually (can't cancel fetch,
      // but we reset all upload state so it will retry if user goes forward again)
      resetUploadState();
      setStep(2);
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '600px', maxWidth: '95vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="section-header">CREATE NEW CASE</div>
            <div className="intel-label" style={{ marginTop: '2px', fontSize: '0.58rem' }}>STEP {step} OF {TOTAL_STEPS} // {stepLabels[step - 1]}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '2px', padding: '0 20px 0', height: '3px', marginTop: '-1px' }}>
          {stepLabels.map((_, i) => (
            <div key={i} style={{ flex: 1, background: i + 1 <= step ? 'var(--accent)' : 'var(--border-dim)', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 160px)' }}>

          {/* Step 1: Case Info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="intel-label">CASE INFORMATION</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 2 }}>
                  <div className="data-key" style={{ marginBottom: '4px' }}>CASE NAME *</div>
                  <input className="intel-input" style={{ width: '100%' }} placeholder="Investigation name..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="data-key" style={{ marginBottom: '4px' }}>CASE ID</div>
                  <input className="intel-input" style={{ width: '100%', color: 'var(--accent-dim)' }} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div className="data-key" style={{ marginBottom: '4px' }}>CASE TYPE</div>
                  <select className="intel-input" style={{ width: '100%' }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {['FINANCIAL_CRIME', 'ORGANIZED_CRIME', 'CYBERCRIME', 'NARCOTICS', 'MONEY_LAUNDERING', 'FRAUD', 'HUMAN_TRAFFICKING', 'TERRORISM'].map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="data-key" style={{ marginBottom: '4px' }}>PRIORITY</div>
                  <select className="intel-input" style={{ width: '100%' }} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 2 }}>
                  <div className="data-key" style={{ marginBottom: '4px' }}>INVESTIGATING OFFICER *</div>
                  <input className="intel-input" style={{ width: '100%' }} placeholder="Officer name and rank..." value={form.officer} onChange={(e) => setForm({ ...form, officer: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="data-key" style={{ marginBottom: '4px' }}>DATE OPENED</div>
                  <input className="intel-input" style={{ width: '100%' }} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="data-key" style={{ marginBottom: '4px' }}>DESCRIPTION</div>
                <textarea
                  className="intel-input"
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Brief description of investigation..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2: Upload Documents */}
          {step === 2 && (
            <div>
              <div className="intel-label" style={{ marginBottom: '6px' }}>UPLOAD INVESTIGATION DOCUMENTS</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Upload raw intelligence data documents (.txt format only).
                The AI extraction pipeline will parse and build the knowledge graph automatically.
              </div>

              {/* Validation error */}
              {validationError && (
                <div style={{ padding: '10px 14px', marginBottom: '14px', background: 'var(--critical-soft)', border: '1px solid var(--critical)', color: 'var(--critical)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <X size={13} style={{ marginTop: '1px', flexShrink: 0 }} />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Drop zone */}
              <div
                className={`upload-dropzone ${isDragOver ? 'upload-dropzone--active' : ''}`}
                style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px', cursor: 'pointer' }}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={28} style={{ color: isDragOver ? 'var(--accent)' : 'var(--text-muted)', transition: 'color 0.2s' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: isDragOver ? 'var(--accent)' : 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    DROP .TXT FILES HERE OR CLICK TO BROWSE
                  </div>
                  <div className="intel-label" style={{ fontSize: '0.6rem' }}>ONLY .TXT FILES — MULTIPLE FILES SUPPORTED</div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".txt,text/plain"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>

              {/* File list */}
              {uploadedFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="intel-label" style={{ fontSize: '0.6rem' }}>QUEUED FILES ({uploadedFiles.length})</div>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {uploadedFiles.map((file, i) => (
                      <div key={`${file.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-base)', borderLeft: '3px solid var(--accent-dim)' }}>
                        <FileText size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
                          title="Remove file"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Uploading */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-base)' }}>
                <Upload size={14} style={{ color: 'var(--accent-dim)' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>Uploading Documents</div>
                  <div className="intel-label" style={{ fontSize: '0.58rem' }}>
                    TRANSMITTING {uploadedFiles.length} FILE{uploadedFiles.length !== 1 ? 'S' : ''} TO NEXUS CORE
                  </div>
                </div>
              </div>

              {/* Loading state */}
              {isUploading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
                  <Loader2 size={32} className="animate-spin-slow" style={{ color: 'var(--accent)' }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    UPLOADING... DO NOT CLOSE WINDOW
                  </div>
                </div>
              )}

              {/* Error state */}
              {!isUploading && uploadError && (
                <div style={{ padding: '16px', background: 'var(--critical-soft)', border: '1px solid var(--critical)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <X size={16} style={{ color: 'var(--critical)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--critical)', letterSpacing: '0.08em' }}>UPLOAD FAILED</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)', marginTop: '6px', lineHeight: 1.5 }}>{uploadError}</div>
                    <div style={{ marginTop: '12px', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ← Use BACK to return and try again.
                    </div>
                  </div>
                </div>
              )}

              {/* Success state */}
              {!isUploading && uploadDone && uploadResponse && !uploadError && (
                <div className="animate-fade-in-up">
                  <div style={{ padding: '12px', background: 'var(--operational-soft)', border: '1px solid var(--operational)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <CheckCircle2 size={16} style={{ color: '#6A9E6A', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#6A9E6A', letterSpacing: '0.08em' }}>UPLOAD COMPLETE</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {uploadResponse.message}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)' }}>
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Files accepted</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{uploadResponse.total_uploaded}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)' }}>
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Pipeline status</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent)' }}>{uploadResponse.pipeline_status}</span>
                    </div>
                    {uploadResponse.files.length > 0 && (
                      <div style={{ marginTop: '4px' }}>
                        <div className="intel-label" style={{ fontSize: '0.58rem', marginBottom: '6px' }}>UPLOADED FILES</div>
                        {uploadResponse.files.map((f) => (
                          <div key={f.filename} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-faint)', marginBottom: '3px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{f.filename}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#6A9E6A' }}>{f.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Create */}
          {step === 4 && (
            <div>
              {uploadResponse && (
                <div style={{ marginBottom: '16px' }}>
                  <div className="intel-label" style={{ marginBottom: '10px' }}>UPLOAD RESULTS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)' }}>
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Files uploaded</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{uploadResponse.total_uploaded}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)' }}>
                      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Pipeline status</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent)' }}>{uploadResponse.pipeline_status}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="divider" style={{ margin: '16px 0' }} />
              <div className="intel-label" style={{ marginBottom: '10px' }}>CASE SUMMARY</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px' }}>
                {[
                  { label: 'Case Name', value: form.name || '—' },
                  { label: 'Case ID', value: form.id },
                  { label: 'Type', value: form.type.replace(/_/g, ' ') },
                  { label: 'Priority', value: form.priority },
                  { label: 'Officer', value: form.officer || '—' },
                  { label: 'Documents', value: `${uploadedFiles.length} file(s)` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-base)' }}>
                    <div className="data-key" style={{ marginBottom: '2px' }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn btn--ghost"
            onClick={handleBack}
            disabled={isUploading}
            style={{ opacity: isUploading ? 0.4 : 1 }}
          >
            {step > 1 ? 'BACK' : 'CANCEL'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {step === 3 && isUploading && (
              <span className="intel-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Loader2 size={12} className="animate-spin-slow" /> UPLOADING...
              </span>
            )}
            <button
              className="btn btn--accent"
              disabled={isNextDisabled || isUploading}
              onClick={handleFooterAction}
              style={{ opacity: (isNextDisabled || isUploading) ? 0.45 : 1 }}
            >
              {step === TOTAL_STEPS
                ? 'CREATE CASE'
                : step === 3
                ? (uploadDone ? 'CONTINUE →' : uploadError ? 'FAILED' : 'UPLOADING...')
                : 'NEXT'}
              {step !== 3 && step !== TOTAL_STEPS && <ArrowRight size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Cases Page ─────────────────────────────────────────────────
const CasesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'active';
  const showCreate = searchParams.get('create') === 'true';
  const [searchQuery, setSearchQuery] = useState('');

  const [activeCases, setActiveCases] = useState<CaseItem[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    getCases()
      .then(setActiveCases)
      .catch(() => setActiveCases([]))
      .finally(() => setLoadingCases(false));
  }, [showCreate]); // re-fetch when modal closes

  const pastCases: CaseItem[] = [];
  const underReview: CaseItem[] = [];

  const allDisplayCases = tab === 'active' ? activeCases : tab === 'past' ? pastCases : underReview;
  const displayCases = searchQuery
    ? allDisplayCases.filter((c) => c.case_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.case_id.toLowerCase().includes(searchQuery.toLowerCase()))
    : allDisplayCases;

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '4px' }}>
            NEXUS // CASE INTELLIGENCE
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 300, color: 'var(--text-primary)' }}>
            Investigation Cases
          </h1>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
            {[
              { label: 'ACTIVE', value: activeCases.length, color: 'var(--operational)' },
              { label: 'UNDER REVIEW', value: underReview.length, color: 'var(--warning)' },
              { label: 'CLOSED', value: pastCases.length, color: 'var(--text-muted)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color }}>
                {value} {label}
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn--accent" onClick={() => setSearchParams({ create: 'true' })} style={{ alignSelf: 'flex-start' }}>
          <Plus size={12} /> CREATE NEW CASE
        </button>
      </div>

      {/* Tabs + Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-dim)', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex' }}>
          {[
            { key: 'active', label: 'ACTIVE', icon: FolderOpen, count: activeCases.length },
            { key: 'review', label: 'UNDER REVIEW', icon: Clock, count: underReview.length },
            { key: 'past',   label: 'PAST',   icon: Archive,    count: pastCases.length },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              className={`intel-tab ${tab === key ? 'intel-tab--active' : ''}`}
              onClick={() => setSearchParams({ tab: key })}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Icon size={11} />
              {label}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', background: 'var(--bg-elevated)', padding: '1px 5px' }}>
                {count}
              </span>
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', marginBottom: '1px' }}>
          <input
            className="intel-input"
            style={{ width: '200px', fontSize: '0.72rem', padding: '6px 10px' }}
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Cases list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {loadingCases ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            LOADING CASES FROM NEO4J...
          </div>
        ) : displayCases.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            {searchQuery ? 'NO CASES MATCH YOUR SEARCH' : 'NO CASES AVAILABLE. UPLOAD DOCUMENTS TO BEGIN.'}
          </div>
        ) : (
          displayCases.map((caseItem, idx) => (
            <div
              key={caseItem.case_id}
              onClick={() => navigate(`/cases/${encodeURIComponent(caseItem.case_id)}/overview`)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                borderLeft: '2px solid var(--accent-dim)',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'background 0.15s',
                display: 'grid',
                gridTemplateColumns: '220px 80px 90px 1fr 1fr 1fr 130px 24px',
                gap: '12px',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.08em' }}>ID-{String(idx + 1).padStart(3, '0')}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, marginTop: '2px' }}>{caseItem.case_name}</div>
              </div>
              <span className="badge badge--active">
                ACTIVE
              </span>
              <span className="badge badge--high">
                HIGH
              </span>
              <div>
                <div className="intel-label">PERSONS</div>
                <div className="data-value">0</div>
              </div>
              <div>
                <div className="intel-label">EVIDENCE</div>
                <div className="data-value">0</div>
              </div>
              <div>
                <div className="intel-label">ENTITIES</div>
                <div className="data-value">{caseItem.total_entities}</div>
              </div>
              <div>
                <div className="intel-label">LAST ACTIVITY</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                </div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          ))
        )}
      </div>

      {/* Create Case Modal */}
      {showCreate && <CreateCaseModal onClose={() => setSearchParams({ tab })} />}
    </div>
  );
};

export default CasesPage;
