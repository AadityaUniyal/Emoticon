'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/auth-helpers';
import styles from '../dashboard.module.css';

export default function BiasPage() {
  const { user, isLoaded } = useUser();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Active learning feedback states
  const [correctedOutput, setCorrectedOutput] = useState('clean');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry?type=cognitive_bias');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      fetchHistory();
    }
  }, [isLoaded, user, fetchHistory]);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), type: 'cognitive_bias' }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Cognitive bias scan failed');
      }

      const data = await res.json();
      setResult(data);
      setCorrectedOutput(data.dominant);
      setFeedbackSubmitted(false);
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFeedback = async () => {
    if (!result) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureType: 'cognitive_bias',
          inputText: text,
          originalOutput: result.dominant,
          correctedOutput,
        }),
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className={styles.playground}>
      {/* Input panel */}
      <div className={styles.inputSection}>
        <div className={styles.overviewHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <span className={styles.sysTag}>// PIPELINE: COGNITIVE_DISTORTION_DETECTOR</span>
            <h1 className={styles.mainTitle} style={{ fontSize: '1.5rem' }}>COGNITIVE_BIAS_SCANNER</h1>
          </div>
        </div>

        <div className={`${styles.inputCard} cyber-card`} style={{ marginTop: '16px' }}>
          <span className="corner-brackets" />
          <div className={styles.cardInfo}>
            <label className={styles.inputLabel}>
              INPUT_TEXT_SEQUENCE
              <span className={styles.charCount}>{text.length} / 5000 BYTES</span>
            </label>
          </div>
          <textarea
            className={styles.textarea}
            placeholder="Type or paste text here to scan for cognitive distortions (e.g. catastrophizing, black-and-white thinking)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={5000}
            rows={5}
          />
          <div className={styles.inputActions}>
            <span className={styles.shortcutHint}>[DISTORTION_PATTERN_SCANNER]</span>
            <button
              className={styles.analyzeBtn}
              onClick={handleAnalyze}
              disabled={analyzing || !text.trim()}
            >
              {analyzing ? 'SCANNING...' : 'SCAN_COGNITION'}
            </button>
          </div>
        </div>

        {/* Samples */}
        <div className={styles.samples}>
          <span className={styles.samplesLabel}>TEST_SUITE_VECTORS:</span>
          {[
            { text: 'Everything is a complete disaster. It is absolutely impossible to make anything work, and we are doomed to failure.', emoji: '🎯' },
            { text: 'Everyone is targeting me because of my fault, they did it on purpose to me.', emoji: '🎯' },
          ].map((sample, idx) => (
            <button
              key={idx}
              className={styles.sampleBtn}
              onClick={() => setText(sample.text)}
            >
              {sample.emoji} {sample.text.slice(0, 55)}...
            </button>
          ))}
        </div>
      </div>

      {/* Results & History */}
      <div className={styles.resultSection}>
        {error && (
          <div className={styles.errorCard} style={{ marginBottom: '24px' }}>
            <span>[ERR_INFERENCE_FAILED]</span>
            <p>{error}</p>
          </div>
        )}

        {result ? (
          <div className={`${styles.resultCard} cyber-card`} style={{ marginBottom: '24px' }}>
            <span className="corner-brackets" />
            <h3 className={styles.panelTitle} style={{ marginBottom: '16px' }}>// DETECTED_COGNITIVE_DISTORTIONS</h3>
            
            {result.metadata?.biases?.length === 0 ? (
              <div style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '16px', border: '1px solid rgba(48,209,88,0.2)', borderRadius: '4px', background: 'rgba(48,209,88,0.02)' }}>
                ✓ [SYS] NO COGNITIVE DISTORTIONS DETECTED. COGNITIVE SPECTRUM IS BALANCED.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {result.metadata?.biases?.map((item, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '14px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: '#ff453a', fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        ⚠️ {item.bias}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#ff9f0a', fontFamily: 'var(--font-mono)' }}>
                        SEVERITY: {Math.round(item.severity * 100)}%
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {item.description}
                    </p>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontStyle: 'italic', marginBottom: '8px' }}>
                      {item.snippet}
                    </div>
                    <div className={styles.confidenceBarWrap}>
                      <div
                        className={styles.confidenceBar}
                        style={{ width: `${Math.round(item.severity * 100)}%`, background: '#ff453a' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active Learning feedback */}
            <div style={{ marginTop: '24px', borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
              {feedbackSubmitted ? (
                <span style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  ✓ [SYS] COGNITIVE_BIAS_TELEMETRY_SYNCED.
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ADJUST_DOMINANT_COEFFICIENT:
                  </span>
                  <select
                    value={correctedOutput}
                    onChange={(e) => setCorrectedOutput(e.target.value)}
                    style={{
                      background: '#050508',
                      border: '1px solid var(--border-cyber)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none'
                    }}
                  >
                    <option value="clean">CLEAN</option>
                    <option value="1 distortions detected">1 DISTORTION</option>
                    <option value="2 distortions detected">2 DISTORTIONS</option>
                    <option value="3 distortions detected">3 DISTORTIONS</option>
                  </select>
                  <button
                    onClick={handleFeedback}
                    disabled={submittingFeedback}
                    className={styles.launchLink}
                    style={{ padding: '4px 10px', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    {submittingFeedback ? 'SYNC...' : 'SUBMIT_CORRECTION'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          !error && (
            <div className={`${styles.emptyResult} cyber-card`} style={{ marginBottom: '24px' }}>
              <span className="corner-brackets" />
              <div className={styles.emptyIcon}>🎯</div>
              <h3>COGNITIVE_BIAS_IDLE</h3>
              <p>Enter text sequences to resolve cognitive distortions and evaluate distortion indicators.</p>
            </div>
          )
        )}

        {/* History Log */}
        <div className={`${styles.panelCard} cyber-card`}>
          <span className="corner-brackets" />
          <h2 className={styles.panelTitle} style={{ marginBottom: '16px' }}>// AUDIT_LOG: COGNITIVE_BIAS</h2>
          {loadingHistory ? (
            <div className={styles.terminalEmpty}>LOAD_RECORDS...</div>
          ) : history.length === 0 ? (
            <div className={styles.terminalEmpty}>NO HISTORICAL RECORDS FOUND.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table} style={{ width: '100%', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px' }}>INPUT</th>
                    <th style={{ padding: '8px' }}>BIAS_STATE</th>
                    <th style={{ padding: '8px' }}>SEVERITY</th>
                    <th style={{ padding: '8px' }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                        {row.inputText.length > 30 ? row.inputText.slice(0, 30) + '...' : row.inputText}
                      </td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: row.dominantOutput === 'clean' ? 'var(--accent-emerald)' : '#ff453a' }}>
                        {row.dominantOutput.toUpperCase()}
                      </td>
                      <td style={{ padding: '8px' }}>{Math.round(row.confidence * 100)}%</td>
                      <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                        {new Date(row.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
