'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/auth-helpers';
import styles from '../dashboard.module.css';

export default function KeyphrasePage() {
  const { user, isLoaded } = useUser();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Active learning feedback states
  const [correctedOutput, setCorrectedOutput] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry?type=keyphrase');
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
        body: JSON.stringify({ text: text.trim(), type: 'keyphrase' }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Keyphrase extraction failed');
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
    if (!result || !correctedOutput.trim()) return;
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureType: 'keyphrase',
          inputText: text,
          originalOutput: result.dominant,
          correctedOutput: correctedOutput.trim(),
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
            <span className={styles.sysTag}>// PIPELINE: KEYPHRASE_EXTRACTION_LAB</span>
            <h1 className={styles.mainTitle} style={{ fontSize: '1.5rem' }}>KEYPHRASE_LAB</h1>
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
            placeholder="Type or paste text to extract explanatory keyphrases..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={5000}
            rows={5}
          />
          <div className={styles.inputActions}>
            <span className={styles.shortcutHint}>[TERM_FREQUENCY_RELEVANCE]</span>
            <button
              className={styles.analyzeBtn}
              onClick={handleAnalyze}
              disabled={analyzing || !text.trim()}
            >
              {analyzing ? 'EXTRACTING...' : 'EXTRACT_KEYPHRASES'}
            </button>
          </div>
        </div>

        {/* Samples */}
        <div className={styles.samples}>
          <span className={styles.samplesLabel}>TEST_SUITE_VECTORS:</span>
          {[
            { text: 'Active learning retrains our ML classification model by pulling corrected user labels from Neon PostgreSQL.', emoji: '📌' },
            { text: 'The sliding-window rate limit checks incoming keys against a Map of timestamps, throwing an HTTP 429 error.', emoji: '📌' },
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
            <h3 className={styles.panelTitle} style={{ marginBottom: '16px' }}>// EXTRACTED_EXPLANATORY_KEYPHRASES</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {result.metadata?.keyphrases?.map((item, idx) => (
                <div key={idx} className={styles.top3Item} style={{ borderBottom: '1px solid rgba(255,255,255,0.01)', paddingBottom: '8px' }}>
                  <span className={styles.top3Rank} style={{ minWidth: '24px' }}>0{idx + 1}.</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'var(--font-mono)', minWidth: '130px' }}>
                    {item.phrase.toUpperCase()}
                  </span>
                  <div className={styles.top3BarWrap}>
                    <div
                      className={styles.top3Bar}
                      style={{ width: `${Math.round(item.score * 100)}%`, background: 'var(--accent-cyan)' }}
                    />
                  </div>
                  <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', minWidth: '45px', textAlign: 'right' }}>
                    {Math.round(item.score * 100)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Active Learning feedback */}
            <div style={{ marginTop: '24px', borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
              {feedbackSubmitted ? (
                <span style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  ✓ [SYS] KEYPHRASE_ALIGNMENT_TELEMETRY_SYNCED.
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ADJUST_DOMINANT_KEYWORD:
                  </span>
                  <input
                    type="text"
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
                      outline: 'none',
                      width: '120px'
                    }}
                  />
                  <button
                    onClick={handleFeedback}
                    disabled={submittingFeedback || !correctedOutput.trim()}
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
              <div className={styles.emptyIcon}>📌</div>
              <h3>KEYPHRASE_IDLE</h3>
              <p>Enter a text sequence to run term frequency weighting and extract explanatory keyphrases.</p>
            </div>
          )
        )}

        {/* History Log */}
        <div className={`${styles.panelCard} cyber-card`}>
          <span className="corner-brackets" />
          <h2 className={styles.panelTitle} style={{ marginBottom: '16px' }}>// AUDIT_LOG: KEYPHRASES</h2>
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
                    <th style={{ padding: '8px' }}>DOMINANT_KEYWORD</th>
                    <th style={{ padding: '8px' }}>WEIGHT</th>
                    <th style={{ padding: '8px' }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                        {row.inputText.length > 30 ? row.inputText.slice(0, 30) + '...' : row.inputText}
                      </td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--accent-indigo)' }}>
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
