'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/auth-helpers';
import styles from '../dashboard.module.css';

const EMOJI_MAP = {
  admiration: '🤩', amusement: '😄', anger: '😠', annoyance: '😤',
  approval: '👍', caring: '🤗', confusion: '😕', curiosity: '🤔',
  desire: '😍', disapproval: '👎', disgust: '🤢', embarrassment: '😳',
  excitement: '🎉', fear: '😨', gratitude: '🙏', grief: '😢',
  joy: '😊', love: '❤️', nervousness: '😰', optimism: '🌟',
  pride: '💪', realization: '💡', relief: '😌', remorse: '😔',
  sadness: '😞', surprise: '😲', neutral: '😐',
};

export default function EmotionPage() {
  const { user, isLoaded } = useUser();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Active learning feedback states
  const [correctedOutput, setCorrectedOutput] = useState('neutral');
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
          featureType: 'emotion',
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


  // Fetch only emotion history logs
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry?type=emotion');
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
        body: JSON.stringify({ text: text.trim(), type: 'emotion' }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Emotion analysis failed');
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

  return (
    <div className={styles.playground}>
      {/* Input panel */}
      <div className={styles.inputSection}>
        <div className={styles.overviewHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <span className={styles.sysTag}>// PIPELINE: GOEMOTIONS_DISTILBERT</span>
            <h1 className={styles.mainTitle} style={{ fontSize: '1.5rem' }}>EMOTION_DIAGNOSTICS_LAB</h1>
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
            placeholder="Type or paste text here to scan for 27 complex emotional states..."
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
                  COMPUTING...
                </>
              ) : (
                'RUN_DIAGNOSTICS'
              )}
            </button>
          </div>
        </div>

        {/* Samples */}
        <div className={styles.samples}>
          <span className={styles.samplesLabel}>TEST_SUITE_VECTORS:</span>
          {[
            { text: 'I am so incredibly proud of the team! We worked late and hit every milestone perfectly.', emoji: '💪' },
            { text: 'I feel a bit nervous about this presentation, my hands are literally shaking.', emoji: '😰' },
            { text: 'Wait, what? How does this even work? The documentation says the opposite.', emoji: '🤔' },
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
            <div className={styles.resultMain}>
              <div className={styles.resultEmoji}>
                {EMOJI_MAP[result.dominant] || '😐'}
              </div>
              <div className={styles.resultInfo}>
                <div className={styles.resultLabelWrap}>
                  <span className={styles.resultLabel}>DOMINANT_COGNITIVE_STATE:</span>
                  <h3 className={styles.resultEmotion}>{result.dominant.toUpperCase()}</h3>
                </div>
                <div className={styles.confidenceBarWrap}>
                  <div
                    className={styles.confidenceBar}
                    style={{ width: `${Math.round(result.confidence * 100)}%` }}
                  />
                </div>
                <div className={styles.resultMeta}>
                  <span>PROBABILITY: {Math.round(result.confidence * 100)}%</span>
                  <span>LATENCY: {result.latency_ms}ms</span>
                  <span className={styles.sourceTag}>{result.source.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Top 3 Breakdown */}
            {result.metadata?.top3 && (
              <div className={styles.top3}>
                <h4 className={styles.top3Title}>// DETECTED_COGNITIVE_SPECTRUM:</h4>
                <div className={styles.top3List}>
                  {result.metadata.top3.map((item, i) => (
                    <div key={item.label} className={styles.top3Item}>
                      <span className={styles.top3Rank}>0{i + 1}.</span>
                      <span className={styles.top3Emoji}>
                        {item.emoji || EMOJI_MAP[item.label] || '😐'}
                      </span>
                      <span className={styles.top3Label}>{item.label}</span>
                      <div className={styles.top3BarWrap}>
                        <div
                          className={styles.top3Bar}
                          style={{ width: `${Math.round(item.score * 100)}%` }}
                        />
                      </div>
                      <span className={styles.top3Score}>{Math.round(item.score * 100)}%</span>
                    </div>
                  ))}
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
                    INCORRECT_INFERENCE? ADJUST_COGNITIVE_STATE:
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
                    {Object.keys(EMOJI_MAP).map(e => (
                      <option key={e} value={e}>{e.toUpperCase()}</option>
                    ))}
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
              <div className={styles.emptyIcon}>🧠</div>
              <h3>DIAGNOSTICS_IDLE</h3>
              <p>Inference pipeline ready. Input sequence packet to begin emotion diagnostics.</p>
            </div>
          )
        )}

        {/* History Table */}
        <div className={`${styles.panelCard} cyber-card`}>
          <span className="corner-brackets" />
          <h2 className={styles.panelTitle} style={{ marginBottom: '16px' }}>// AUDIT_LOG: EMOTION</h2>
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
                    <th style={{ padding: '8px' }}>DOMINANT_STATE</th>
                    <th style={{ padding: '8px' }}>CONFIDENCE</th>
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
                        {EMOJI_MAP[row.dominantOutput] || '😐'} {row.dominantOutput.toUpperCase()}
                      </td>
                      <td style={{ padding: '8px' }}>{Math.round(row.confidence * 100)}%</td>
                      <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                        {new Date(row.createdAt).toLocaleTimeString('en-US', { hour12: false })}
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
