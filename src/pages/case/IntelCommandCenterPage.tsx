import React from 'react';
import { useParams } from 'react-router-dom';
import IntelCommandCenter from '../../components/case/IntelCommandCenter';

const IntelCommandCenterPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();

  if (!caseId) {
    return <div style={{ color: 'var(--critical)', padding: '24px' }}>Error: No case ID provided.</div>;
  }

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="section-header" style={{ marginBottom: '16px' }}>INTEL COMMAND CENTER</div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <IntelCommandCenter caseId={caseId} />
      </div>
    </div>
  );
};

export default IntelCommandCenterPage;
