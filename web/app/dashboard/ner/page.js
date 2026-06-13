'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/auth-helpers';
import styles from '../dashboard.module.css';

export default function NERPage() {
  const { user, isLoaded } = useUser();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Active learning feedback states
  const [correctedOutput, setCorrectedOutput] = useState('correct_entities');
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
          featureType: 'ner',
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
      const res = await fetch('/api/telemetry?type=ner');
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
        body: JSON.stringify({ text: text.trim(), type: 'ner' }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Entity extraction failed');
      }

      const data = await res.json();
      setResult(data);
      setCorrectedOutput('correct_entities');
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

  // Text highlighting renderer
  const renderHighlightedText = () => {
    if (!result || !result.metadata?.entities || result.metadata.entities.length === 0) {
      return text;
    }

    const entities = result.metadata.entities;
    // Sort descending by index to prevent index shifting during replacement
    const sorted = [...entities].sort((a, b) => b.index - a.index);
    
    let elements = [];
    let lastIdx = text.length;

    for (const ent of sorted) {
      const entStart = ent.index;
      const entEnd = entStart + ent.text.length;

      if (entEnd <= lastIdx && entStart >= 0) {
        // String after the entity
        const postText = text.substring(entEnd, lastIdx);
        if (postText) {
          elements.unshift(postText);
        }

        // The entity span itself
        elements.unshift(
          <span 
            key={entStart} 
            className={`${styles.entitySpan} ${styles['entity' + ent.type] || ''}`}
            data-type={ent.type}
          >
            {text.substring(entStart, entEnd)}
            <span className={styles.entityBadge}>{ent.type}</span>
          </span>
        );

        lastIdx = entStart;
      }
    }

    // String before the first entity
    if (lastIdx > 0) {
      elements.unshift(text.substring(0, lastIdx));
    }

    return elements;
  };

  return (
    <div className={styles.playground}>
      {/* Input panel */}
      <div className={styles.inputSection}>
        <div className={styles.overviewHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <span className={styles.sysTag}>// PIPELINE: NER_DICTIONARY_PARSER_V1</span>
            <h1 className={styles.mainTitle} style={{ fontSize: '1.5rem' }}>ENTITY_EXTRACTOR</h1>
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
            placeholder="Type or paste text here to scan for people, organizations, locations, and dates..."
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
            >
              {analyzing ? (
                <>
                  <span className={styles.btnSpinner} />
                  EXTRACTING...
                </>
              ) : (
                'EXTRACT_ENTITIES'
              )}
            </button>
          </div>
        </div>

        {/* Samples */}
        <div className={styles.samples}>
          <span className={styles.samplesLabel}>TEST_SUITE_VECTORS:</span>
          {[
            { text: 'Aaditya Uniyal visited the Google offices in London last Friday to meet the DeepMind engineers.', emoji: '🔍' },
            { text: 'Microsoft announced their new campus expansion in Seattle on Monday, June 2026.', emoji: '🏢' },
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
            
            <h4 className={styles.top3Title} style={{ marginBottom: '12px' }}>// ANNOTATED_SEQUENCE_VIEW:</h4>
            
            <div className={styles.terminalContainer} style={{ background: '#030306', color: '#eaeaea', maxHeight: 'none', fontSize: '0.85rem', lineHeight: '1.8', marginBottom: '20px' }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {renderHighlightedText()}
              </div>
            </div>

            <div className={styles.resultMain} style={{ margin: 0, padding: '16px' }}>
              <div className={styles.resultInfo} style={{ width: '100%' }}>
                <span className={styles.resultLabel}>EXTRACTION_SUMMARY:</span>
                <h3 className={styles.resultEmotion} style={{ color: 'var(--accent-cyan)', marginTop: '4px' }}>
                  {result.metadata?.entities?.length || 0} ENTITIES_FOUND
                </h3>
                <div className={styles.resultMeta} style={{ marginTop: '12px', borderTop: '1px dashed var(--border)', paddingTop: '10px' }}>
                  <span>STATUS: COMPLETE</span>
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
                    INCORRECT_INFERENCE? ADJUST_ENTITIES_ACCURACY:
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
                    <option value="correct_entities">CORRECT_ENTITIES</option>
                    <option value="missing_entities">MISSING_ENTITIES</option>
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
              <div className={styles.emptyIcon}>🔍</div>
              <h3>EXTRACTION_IDLE</h3>
              <p>Inference pipeline ready. Input sequence packet to begin named entity recognition.</p>
            </div>
          )
        )}

        {/* History Table */}
        <div className={`${styles.panelCard} cyber-card`}>
          <span className="corner-brackets" />
          <h2 className={styles.panelTitle} style={{ marginBottom: '16px' }}>// AUDIT_LOG: ENTITIES</h2>
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
                    <th style={{ padding: '8px' }}>ENTITIES_DETECTED</th>
                    <th style={{ padding: '8px' }}>CONFIDENCE</th>
                    <th style={{ padding: '8px' }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => {
                    let entityCount = 0;
                    try {
                      const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
                      entityCount = meta?.entities?.length || 0;
                    } catch (e) {
                      entityCount = 0;
                    }
                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                          {row.inputText.length > 30 ? row.inputText.slice(0, 30) + '...' : row.inputText}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                          {entityCount} ENTITIES
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
