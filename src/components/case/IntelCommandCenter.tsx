import React, { useState, useEffect, useRef } from 'react';
import { Send, Activity, User, MessageSquare, Loader2, Info } from 'lucide-react';

interface IntelCommandCenterProps {
  caseId: string;
}

interface FeedItem {
  id: string;
  timestamp: string;
  investigator: string;
  message: string;
  action: string;
}

const IntelCommandCenter: React.FC<IntelCommandCenterProps> = ({ caseId }) => {
  const [investigatorName, setInvestigatorName] = useState('Detective Smith');
  const [intelText, setIntelText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  
  const wsRef = useRef<WebSocket | null>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll feed to the bottom when new items arrive
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed]);

  // Toast auto-hide timer
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => setToast({ message: '', visible: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
  };

  // 3. WebSocket Integration (Real-Time Sync)
  useEffect(() => {
    if (!caseId) return;

    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/cases/${caseId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`WebSocket connected to case: ${caseId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Listen for GRAPH_UPDATED events
        if (data.event === 'GRAPH_UPDATED') {
          // Extract investigator name from message if possible, else default to 'Team Member'
          const investigatorMatch = data.message.match(/^([^ ]+ [^ ]+)/);
          const investigator = investigatorMatch ? investigatorMatch[1] : 'Team Member';

          const newFeedItem: FeedItem = {
            id: Date.now().toString() + Math.random().toString(),
            timestamp: new Date().toLocaleTimeString(),
            investigator: investigator,
            message: data.message,
            action: 'GRAPH_UPDATED',
          };
          
          // 1. Add message to the Live Operations Feed
          setFeed(prev => [...prev, newFeedItem]);

          // 2. Trigger mock function fetchGraphData()
          // fetchGraphData();
          console.log('[Mock] fetchGraphData() called to refresh D3/React-Force-Graph component');

          // 3. Show toast notification
          showToast('Graph updated by team member');
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    // Cleanup WebSocket on component unmount
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [caseId]);

  // 2. REST API Integration (Submitting Intel)
  const handleSubmitIntel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intelText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8000/api/cases/${caseId}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigator_name: investigatorName,
          text: intelText
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit intelligence');
      }

      // Success - clear input box
      setIntelText('');
      showToast('Intelligence submitted successfully');
      
      // Note: The message will appear in the feed once the WebSocket broadcasts it back.

    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error submitting intelligence');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: 'var(--bg-void)', color: 'var(--text-primary)', border: '1px solid var(--border-base)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
      
      {/* Toast Notification */}
      {toast.visible && (
        <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: 'var(--accent)', color: 'var(--bg-void)', padding: '8px 16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', transition: 'all 0.3s ease' }}>
          <Info size={16} />
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}

      {/* Left Panel (The Copilot Input) */}
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-dim)', padding: '24px', background: 'var(--bg-surface)' }}>
        <div style={{ marginBottom: '24px' }}>
          <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
            <MessageSquare className="text-blue-400" size={18} style={{ color: 'var(--accent)' }} />
            INTEL COPILOT
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.1em' }}>NATURAL LANGUAGE GRAPH MUTATION</p>
        </div>

        <form onSubmit={handleSubmitIntel} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Investigator Name Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="intel-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={12} /> INVESTIGATOR ID
            </label>
            <input
              type="text"
              value={investigatorName}
              onChange={(e) => setInvestigatorName(e.target.value)}
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', width: '100%', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-dim)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-dim)')}
              placeholder="e.g. Detective Smith"
              required
            />
          </div>

          {/* Intelligence Textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label className="intel-label">
              INTELLIGENCE INPUT
            </label>
            <textarea
              value={intelText}
              onChange={(e) => setIntelText(e.target.value)}
              style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', color: 'var(--text-primary)', padding: '12px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', width: '100%', resize: 'none', outline: 'none' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-dim)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-dim)')}
              placeholder="E.g., Tariq Mansoor is not related to Elena Rotsova but he was seen at the Warehouse..."
              required
            />
          </div>

          {/* Submit Intel Button */}
          <button
            type="submit"
            className="btn btn--accent"
            disabled={isSubmitting || !intelText.trim()}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', opacity: (isSubmitting || !intelText.trim()) ? 0.5 : 1, cursor: (isSubmitting || !intelText.trim()) ? 'not-allowed' : 'pointer' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> PROCESSING...
              </>
            ) : (
              <>
                <Send size={16} /> SUBMIT INTEL
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Panel (Live Team Feed) */}
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', padding: '24px', background: 'var(--bg-void)' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
              <Activity size={18} style={{ color: 'var(--text-muted)' }} />
              LIVE OPERATIONS FEED
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.1em' }}>WEBSOCKET SYNC: CONNECTED</p>
          </div>
          {/* Live Ping Indicator */}
          <div className="status-dot status-dot--operational animate-pulse-accent" style={{ width: '10px', height: '10px' }} />
        </div>

        {/* Scrollable Feed Window */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {feed.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', gap: '12px' }}>
              <Activity size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Listening for real-time updates...</p>
            </div>
          ) : (
            feed.map((item) => (
              <div key={item.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderLeft: '2px solid var(--accent)', borderRadius: '4px', padding: '12px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.investigator}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--text-faint)', letterSpacing: '0.1em' }}>{item.timestamp}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="badge badge--active" style={{ marginBottom: '8px' }}>
                    {item.action}
                  </span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.5, wordBreak: 'break-word', margin: 0 }}>
                    {item.message}
                  </p>
                </div>
              </div>
            ))
          )}
          {/* Anchor for auto-scroll */}
          <div ref={feedEndRef} />
        </div>
      </div>
      
    </div>
  );
};

export default IntelCommandCenter;
