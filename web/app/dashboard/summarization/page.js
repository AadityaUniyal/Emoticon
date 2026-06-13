'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/auth-helpers';
import styles from '../dashboard.module.css';

export default function SummarizationPage() {
  const { user, isLoaded } = useUser();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Active learning feedback states
  const [correctedOutput, setCorrectedOutput] = useState('satisfactory');
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
          featureType: 'summarization',
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
      const res = await fetch('/api/telemetry?type=summarization');
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
        body: JSON.stringify({ text: text.trim(), type: 'summarization' }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Text compaction failed');
      }

      const data = await res.json();
      setResult(data);
      setCorrectedOutput('satisfactory');
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

  return (
    <div className={styles.playground}>
      {/* Input panel */}
      <div className={styles.inputSection}>
        <div className={styles.overviewHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <span className={styles.sysTag}>// PIPELINE: EXTRACTIVE_COMPACTION_L2</span>
            <h1 className={styles.mainTitle} style={{ fontSize: '1.5rem' }}>TEXT_COMPACTOR</h1>
          </div>
        </div>

        <div className={`${styles.inputCard} cyber-card`} style={{ marginTop: '16px' }}>
          <span className="corner-brackets" />
          <div className={styles.cardInfo}>
            <label className={styles.inputLabel}>
              LONG_TEXT_SEQUENCE
              <span className={styles.charCount}>{text.length} / 5000 BYTES</span>
            </label>
          </div>
          <textarea
            className={styles.textarea}
            placeholder="Insert lengthy article or paragraphs here for extractive sentence scoring and text compaction..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={5000}
            rows={8}
          />
          <div className={styles.inputActions}>
            <span className={styles.shortcutHint}>[CTRL + ENTER] RUN_INFERENCE</span>
            <button
              className={styles.analyzeBtn}
              onClick={handleAnalyze}
              disabled={analyzing || !text.trim()}
            >
              {analyzing ? (
                <>
                  <span className={styles.btnSpinner} />
                  COMPRESSING...
                </>
              ) : (
                'COMPACT_TEXT'
              )}
            </button>
          </div>
        </div>

        {/* Samples */}
        <div className={styles.samples}>
          <span className={styles.samplesLabel}>TEST_SUITE_VECTORS:</span>
          {[
            { 
              text: 'Artificial Intelligence has rapidly evolved over the past decade. Researchers have made breakthroughs in neural network design and transformer architectures. Consequently, natural language understanding has reached human-parity benchmarks in several tests. However, scaling laws are starting to hit physical boundaries regarding hardware memory and electrical power consumption. Thus, future developments might focus on sparse computations and algorithmic efficiency rather than brute force scaling.', 
              emoji: '🧬' 
            },
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
          <div className={`${styles.resultCard} cyber-card`} style={{ marginBottom: '24px' }}>
            <span className="corner-brackets" />
            <h4 className={styles.top3Title} style={{ marginBottom: '12px' }}>// EXTRACTIVE_SUMMARY_OUTPUT:</h4>
            
            <div className={styles.terminalContainer} style={{ background: '#020205', maxHeight: 'none', color: '#fff', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '20px' }}>
              {result.metadata?.summary}
            </div>

            <div className={styles.resultMain} style={{ margin: 0, padding: '16px' }}>
              <div className={styles.resultInfo} style={{ width: '100%' }}>
                <span className={styles.resultLabel}>COMPACTION_METRICS:</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>COMPRESSION_RATIO:</span>
                    <h4 style={{ color: 'var(--accent-cyan)' }}>
                      {Math.round((1 - result.metadata.ratio) * 100)}% REDUCTION
                    </h4>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SEQUENCE_SIZE:</span>
                    <h4 style={{ color: 'var(--text-primary)' }}>
                      {result.metadata.summary_length} / {result.metadata.original_length} BYTES
                    </h4>
                  </div>
                </div>
                <div className={styles.resultMeta} style={{ marginTop: '12px', borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
                  <span>RATIO: {result.metadata.ratio}</span>
                  <span>LATENCY: {result.latency_ms}ms</span>
                  <span className={styles.sourceTag}>{result.source.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Active Learning feedback loop adjustment */}
            <div style={{ marginTop: '24px', borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
              {feedbackSubmitted ? (
                <span style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  ✓ [SYS] ACTIVE_LEARNING_METRIC_ADJUSTED. TELEMETRY SYNCHRONIZED.
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    INCORRECT_INFERENCE? ADJUST_COMPACTION_QUALITY:
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
                    <option value="satisfactory">SATISFACTORY</option>
                    <option value="needs_improvement">NEEDS_IMPROVEMENT</option>
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
              <div className={styles.emptyIcon}>📝</div>
              <h3>COMPACTION_IDLE</h3>
              <p>Inference pipeline ready. Input sequence packet to begin text summarization.</p>
            </div>
          )
        )}

        {/* History Table */}
        <div className={`${styles.panelCard} cyber-card`}>
          <span className="corner-brackets" />
          <h2 className={styles.panelTitle} style={{ marginBottom: '16px' }}>// AUDIT_LOG: SUMMARIZATION</h2>
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
                    <th style={{ padding: '8px' }}>COMPRESSED_SUMMARY</th>
                    <th style={{ padding: '8px' }}>RATIO</th>
                    <th style={{ padding: '8px' }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    let summaryText = '';
                    try {
                      const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
                      summaryText = meta?.summary || '';
                    } catch (e) {
                      summaryText = row.dominantOutput;
                    }
                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                          {row.inputText.length > 25 ? row.inputText.slice(0, 25) + '...' : row.inputText}
                        </td>
                        <td style={{ padding: '8px', color: 'var(--accent-cyan)' }}>
                          {summaryText.length > 30 ? summaryText.slice(0, 30) + '...' : summaryText}
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
