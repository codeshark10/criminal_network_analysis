import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, Loader2, Info } from 'lucide-react';
import { useCaseData } from '../../context/CaseDataContext';

interface StructuredDataUploadProps {
  caseId: string;
  csvType: 'CDR' | 'FINANCIAL';
}

const StructuredDataUpload: React.FC<StructuredDataUploadProps> = ({ caseId, csvType }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { addCaseAlert } = useCaseData();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !caseId) return;

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('csv_type', csvType);
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/api/cases/upload-structured-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed with status ' + response.status);
      }

      const data = await response.json();
      
      addCaseAlert(caseId, {
        title: 'Upload Successful',
        description: data.message || `Successfully ingested ${csvType} records.`,
        severity: 'LOW',
        category: 'DATA_INGESTION',
        status: 'ACTIVE',
        caseId: caseId,
        evidenceIds: [],
        personIds: []
      });

      setSelectedFile(null);
    } catch (error: any) {
      addCaseAlert(caseId, {
        title: 'Upload Failed',
        description: error.message || 'There was an error uploading the CSV file.',
        severity: 'HIGH',
        category: 'DATA_INGESTION',
        status: 'ACTIVE',
        caseId: caseId,
        evidenceIds: [],
        personIds: []
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div className="section-header">STRUCTURED DATA UPLOAD</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            MODE: {csvType}
          </div>
        </div>
        <Info size={16} style={{ color: 'var(--accent-dim)' }} />
      </div>

      <div
        className={`upload-dropzone ${isDragOver ? 'upload-dropzone--active' : ''}`}
        style={{
          minHeight: '160px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '20px',
          cursor: 'pointer',
          border: isDragOver ? '1px dashed var(--accent)' : '1px dashed var(--border-dim)',
          background: isDragOver ? 'var(--accent-faint)' : 'transparent',
          transition: 'all 0.2s',
          padding: '24px'
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <UploadCloud size={32} style={{ color: isDragOver ? 'var(--accent)' : 'var(--text-muted)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: isDragOver ? 'var(--accent)' : 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: '4px' }}>
            DROP {csvType} .CSV FILE HERE OR CLICK TO BROWSE
          </div>
          <div className="intel-label" style={{ fontSize: '0.6rem' }}>ONLY .CSV FILES SUPPORTED FOR THIS INGESTION TYPE</div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {selectedFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-base)', borderLeft: '3px solid var(--accent-dim)', marginBottom: '20px' }}>
          <File size={16} style={{ color: 'var(--accent)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>{selectedFile.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{(selectedFile.size / 1024).toFixed(1)} KB</div>
          </div>
          <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} disabled={isUploading}>
            <X size={14} />
          </button>
        </div>
      )}

      <button
        className="btn btn--accent"
        style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
        disabled={!selectedFile || isUploading}
        onClick={handleUpload}
      >
        {isUploading ? (
          <>
            <Loader2 size={14} className="animate-spin-slow" />
            <span style={{ marginLeft: '8px' }}>INGESTING DATA...</span>
          </>
        ) : (
          'START INGESTION'
        )}
      </button>
    </div>
  );
};

export default StructuredDataUpload;
