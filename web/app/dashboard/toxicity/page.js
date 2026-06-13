'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/auth-helpers';
import styles from '../dashboard.module.css';

export default function ToxicityPage() {
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

  const handleFeedback = async () => {
    if (!result) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureType: 'toxicity',
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


  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry?type=toxicity');
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
        body: JSON.stringify({ text: text.trim(), type: 'toxicity' }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Toxicity check failed');
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

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleAnalyze();
    }
  };

  const isToxic = result?.dominant === 'toxic';

  return (
    <div className={styles.playground}>
      {/* Input panel */}
      <div className={styles.inputSection}>
        <div className={styles.overviewHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <span className={styles.sysTag}>// PIPELINE: CONTENT_MODERATION_SHIELD</span>
            <h1 className={styles.mainTitle} style={{ fontSize: '1.5rem' }}>MODERATION_SCAN</h1>
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
            placeholder="Type or paste text here to scan for harassment, threats, insults, or toxicity..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={5000}
            rows={5}
          />
          <div className={styles.inputActions}>
            <span className={styles.shortcutHint}>[CTRL + ENTER] RUN_INFERENCE</span>
            <button
              className={styles.analyzeBtn}
              onClick={handleAnalyze}
              disabled={analyzing || !text.trim()}
              style={{ background: isToxic ? 'red' : '' }}
            >
              {analyzing ? (
                <>
                  <span className={styles.btnSpinner} />
                  COMPUTING...
                </>
              ) : (
                'RUN_SAFETY_SCAN'
              )}
            </button>
          </div>
        </div>

        {/* Samples */}
        <div className={styles.samples}>
          <span className={styles.samplesLabel}>TEST_SUITE_VECTORS:</span>
          {[
            { text: 'I absolutely refuse to work with that complete idiot. He is garbage at his job.', emoji: '🤬' },
            { text: 'If you ever come near my house again, I will personally make sure you regret it.', emoji: '⚠️' },
            { text: 'Hello! I wanted to check if you had some time to discuss the project today.', emoji: '🟢' },
          ].map((sample, idx) => (
            <button
              key={idx}
              className={styles.sampleBtn}
              onClick={() => setText(sample.text)}
            >
              {sample.emoji} {sample.text.slice(0, 50)}...
            </button>
          ))}
        </div>
      </div>

      {/* Results & History Panel */}
      <div className={styles.resultSection}>
        {error && (
          <div className={styles.errorCard} style={{ marginBottom: '24px' }}>
            <span>[ERR_INFERENCE_FAILED]</span>
            <p>{error}</p>
          </div>
        )}

        {result ? (
          <div 
            className={`${styles.resultCard} cyber-card`} 
            style={{ 
              marginBottom: '24px', 
              borderColor: isToxic ? 'red' : 'var(--accent-emerald)',
              boxShadow: isToxic ? '0 0 25px rgba(255, 0, 0, 0.15)' : ''
            }}
          >
            <span className="corner-brackets" style={{ borderColor: isToxic ? 'red' : 'var(--accent-emerald)' }} />
            <div className={styles.resultMain}>
              <div className={styles.resultEmoji} style={{ color: isToxic ? 'red' : 'var(--accent-emerald)' }}>
                {isToxic ? '☣️' : '🛡️'}
              </div>
              <div className={styles.resultInfo}>
                <div className={styles.resultLabelWrap}>
                  <span className={styles.resultLabel}>SAFETY_DECISION:</span>
                  <h3 className={styles.resultEmotion} style={{ color: isToxic ? 'red' : 'var(--accent-emerald)' }}>
                    {result.dominant.toUpperCase()}
                  </h3>
                </div>
                <div className={styles.confidenceBarWrap}>
                  <div
                    className={styles.confidenceBar}
                    style={{ 
                      width: `${Math.round(result.confidence * 100)}%`,
                      background: isToxic ? 'red' : 'var(--accent-emerald)'
                    }}
                  />
                </div>
                <div className={styles.resultMeta}>
                  <span>CONFIDENCE: {Math.round(result.confidence * 100)}%</span>
                  <span>LATENCY: {result.latency_ms}ms</span>
                  <span className={styles.sourceTag}>{result.source.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Toxic categories breakdown */}
            {result.metadata && (
              <div className={styles.top3}>
                <h4 className={styles.top3Title}>// THREAT_VECTORS_REPORT:</h4>
                <div className={styles.top3List}>
                  {Object.entries(result.metadata).map(([label, score], i) => {
                    const isHigh = score > 0.35;
                    return (
                      <div key={label} className={styles.top3Item}>
                        <span className={styles.top3Rank}>0{i + 1}.</span>
                        <span className={styles.top3Emoji}>
                          {isHigh ? '🚨' : '🟢'}
                        </span>
                        <span className={styles.top3Label} style={{ color: isHigh ? 'red' : 'var(--text-secondary)' }}>
                          {label.toUpperCase()}
                        </span>
                        <div className={styles.top3BarWrap}>
                          <div
                            className={styles.top3Bar}
                            style={{ 
                              width: `${Math.round(score * 100)}%`,
                              background: isHigh ? 'red' : 'var(--border-cyber)'
                            }}
                          />
                        </div>
                        <span className={styles.top3Score} style={{ color: isHigh ? 'red' : 'var(--text-secondary)' }}>
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Learning feedback loop adjustment */}
            <div style={{ marginTop: '24px', borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
              {feedbackSubmitted ? (
                <span style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  ✓ [SYS] ACTIVE_LEARNING_METRIC_ADJUSTED. TELEMETRY SYNCHRONIZED.
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    INCORRECT_INFERENCE? ADJUST_SAFETY_DECISION:
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
                    <option value="toxic">TOXIC</option>
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
              <div className={styles.emptyIcon}>🛡️</div>
              <h3>DIAGNOSTICS_IDLE</h3>
              <p>Inference pipeline ready. Input sequence packet to begin toxicity scanning.</p>
            </div>
          )
        )}

        {/* History Table */}
        <div className={`${styles.panelCard} cyber-card`}>
          <span className="corner-brackets" />
          <h2 className={styles.panelTitle} style={{ marginBottom: '16px' }}>// AUDIT_LOG: SAFETY</h2>
          {loadingHistory ? (
            <div className={styles.terminalEmpty}>LOAD_RECORDS...</div>
          ) : history.length === 0 ? (
            <div className={styles.terminalEmpty}>NO HISTORICAL TELEMETRY FOUND.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table} style={{ width: '100%', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px' }}>INPUT_SEQUENCE</th>
                    <th style={{ padding: '8px' }}>SAFETY_DECISION</th>
                    <th style={{ padding: '8px' }}>RISK_LEVEL</th>
                    <th style={{ padding: '8px' }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    const rowToxic = row.dominantOutput === 'toxic';
                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                          {row.inputText.length > 30 ? row.inputText.slice(0, 30) + '...' : row.inputText}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: rowToxic ? 'red' : 'var(--accent-emerald)' }}>
                          {rowToxic ? '☣️ TOXIC' : '🛡️ CLEAN'}
                        </td>
                        <td style={{ padding: '8px' }}>{Math.round(row.confidence * 100)}%</td>
                        <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                          {new Date(row.createdAt).toLocaleTimeString('en-US', { hour12: false })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
