'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/lib/auth-helpers';
import styles from '../dashboard.module.css';

export default function TuningPage() {
  const { user, isLoaded } = useUser();
  const [corrections, setCorrections] = useState([]);
  const [loadingCorrections, setLoadingCorrections] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [logs, setLogs] = useState([]);
  const consoleEndRef = useRef(null);

  // Fetch Corrections
  const fetchCorrections = async () => {
    try {
      const res = await fetch('/api/tuning');
      if (res.ok) {
        const data = await res.json();
        setCorrections(data);
      }
    } catch (err) {
      console.error('Failed to fetch corrections:', err);
    } finally {
      setLoadingCorrections(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchCorrections();
    }
  }, [isLoaded, user]);

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Delete specific correction
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/tuning?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCorrections(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete correction:', err);
    }
  };

  // Clear all corrections
  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all feedback submissions?')) return;
    try {
      const res = await fetch('/api/tuning', {
        method: 'DELETE',
      });
      if (res.ok) {
        setCorrections([]);
      }
    } catch (err) {
      console.error('Failed to clear corrections:', err);
    }
  };

  // Trigger Retraining Stream
  const handleRetrain = async () => {
    setRetraining(true);
    setLogs([]);
    try {
      const res = await fetch('/api/tuning', {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to initialize fine-tuning stream.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last partial line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const logObj = JSON.parse(line);
              setLogs(prev => [...prev, logObj]);
            } catch (err) {
              setLogs(prev => [...prev, { text: line, timestamp: new Date().toISOString() }]);
            }
          }
        }
      }

      // Refresh corrections when retraining completes
      fetchCorrections();
    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, { text: `❌ Retraining failed: ${err.message}`, timestamp: new Date().toISOString() }]);
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className={styles.playground}>
      {/* Active Learning Corrections */}
      <div className={styles.inputSection}>
        <div className={styles.overviewHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <span className={styles.sysTag}>// MODULE: ACTIVE_LEARNING_LAB</span>
            <h1 className={styles.mainTitle} style={{ fontSize: '1.5rem' }}>MODEL_TUNING_CONSOLE</h1>
          </div>
        </div>

        <div className={`${styles.panelCard} cyber-card`} style={{ marginTop: '16px' }}>
          <span className="corner-brackets" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className={styles.panelTitle} style={{ margin: 0 }}>// OPERATOR_CORRECTIONS</h2>
            {corrections.length > 0 && (
              <button 
                onClick={handleClearAll}
                className={styles.sampleBtn}
                style={{ borderColor: 'rgba(255, 69, 58, 0.4)', color: '#ff453a' }}
              >
                🗑️ CLEAR_ALL
              </button>
            )}
          </div>

          {loadingCorrections ? (
            <div className={styles.terminalEmpty}>LOADING CORRECTIONS...</div>
          ) : corrections.length === 0 ? (
            <div className={styles.terminalEmpty} style={{ padding: '32px 16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🤖</div>
              <h4>NO CORRECTIONS FOUND</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                Use the diagnostics pages (e.g., Emotion, Sentiment, Toxicity) to submit alignment corrections.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '450px', overflowY: 'auto' }}>
              <table className={styles.table} style={{ width: '100%', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px' }}>FEATURE</th>
                    <th style={{ padding: '8px' }}>INPUT_TEXT</th>
                    <th style={{ padding: '8px' }}>ORIGINAL</th>
                    <th style={{ padding: '8px' }}>CORRECTED</th>
                    <th style={{ padding: '8px', width: '50px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {corrections.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '8px', color: 'var(--accent-indigo)', fontWeight: 'bold' }}>
                        {row.featureType.toUpperCase()}
                      </td>
                      <td style={{ padding: '8px', color: 'var(--text-secondary)' }} title={row.inputText}>
                        {row.inputText.length > 30 ? row.inputText.slice(0, 30) + '...' : row.inputText}
                      </td>
                      <td style={{ padding: '8px', color: '#ff453a' }}>
                        {row.originalOutput}
                      </td>
                      <td style={{ padding: '8px', color: '#30d158', fontWeight: 'bold' }}>
                        {row.correctedOutput}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <button 
                          onClick={() => handleDelete(row.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                          title="Remove Correction"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Model Retraining & CRT Logs */}
      <div className={styles.resultSection}>
        <div className={`${styles.panelCard} cyber-card`}>
          <span className="corner-brackets" />
          <h2 className={styles.panelTitle} style={{ marginBottom: '16px' }}>// TRAINING_INITIATOR</h2>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '4px', marginBottom: '24px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Fine-tune pipeline weights using the operator corrections dataset. Retraining aligns the primary DistilBERT and classification layers against custom edge cases.
            </p>
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className={styles.analyzeBtn}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              {retraining ? (
                <>
                  <span className={styles.btnSpinner} />
                  RETRAINING_MODEL_IN_PROGRESS...
                </>
              ) : (
                '🔥 TRIGGER_MODEL_RETRAINING'
              )}
            </button>
          </div>

          <h2 className={styles.panelTitle} style={{ marginBottom: '10px' }}>// TRAINING_CONSOLE_OUTPUT</h2>
          <div 
            style={{
              background: '#04060a',
              border: '1px solid var(--border-cyber)',
              borderRadius: '4px',
              height: '350px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#39ff14',
              padding: '12px',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: 'inset 0 0 10px rgba(0, 255, 0, 0.1)'
            }}
          >
            {/* CRT scanline simulation */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                backgroundSize: '100% 4px, 6px 100%',
                pointerEvents: 'none',
                opacity: 0.8
              }}
            />
            {logs.length === 0 ? (
              <div style={{ color: '#888', fontStyle: 'italic' }}>Console idle. Awaiting fine-tuning trigger...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '6px', whiteSpace: 'pre-wrap', textShadow: '0 0 2px #39ff14' }}>
                  <span style={{ color: '#888' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.text}
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
