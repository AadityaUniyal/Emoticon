'use client';

import { useState, useRef, useEffect } from 'react';
import styles from '../dashboard.module.css';

const VOICE_PHRASES = [
  "Initialize neural uplink. Access logs suggest connection is secure.",
  "I am extremely frustrated with the performance latency of this network node.",
  "Google developers met in Seattle last Friday to discuss deep learning architectures.",
  "Please summarize the main findings of this research paper immediately.",
  "Warning: Do not execute arbitrary code on production databases without authorization."
];

export default function AudioPage() {
  const [featureType, setFeatureType] = useState('emotion');
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  // Audio canvas visualization state
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const draw = () => {
      ctx.fillStyle = 'rgba(3, 3, 4, 0.2)';
      ctx.fillRect(0, 0, width, height);

      ctx.beginPath();
      ctx.strokeStyle = '#5856d6';
      ctx.lineWidth = 2;

      // Draw random wave bars to simulate live speech frequencies
      const totalBars = 30;
      const spacing = width / totalBars;

      for (let i = 0; i < totalBars; i++) {
        const x = i * spacing;
        const amplitude = recording ? (Math.random() * 40 + 5) : 2;
        const y1 = height / 2 - amplitude;
        const y2 = height / 2 + amplitude;

        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
      }

      ctx.stroke();
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    // Draw flat line
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#030304';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(88, 86, 214, 0.2)';
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }
  };

  useEffect(() => {
    stopVisualization();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleToggleRecord = () => {
    if (!recording) {
      setRecording(true);
      setTranscript('');
      setResult(null);
      setError('');
      startVisualization();
    } else {
      setRecording(false);
      stopVisualization();
      triggerTranscription();
    }
  };

  const triggerTranscription = () => {
    setProcessing(true);
    
    // Simulate Whisper Speech-to-Text latency
    setTimeout(async () => {
      // Pick a realistic phrase matching the selected feature
      let phrase = VOICE_PHRASES[Math.floor(Math.random() * VOICE_PHRASES.length)];
      if (featureType === 'toxicity') {
        phrase = "Warning: Do not execute arbitrary code on production databases without authorization.";
      } else if (featureType === 'ner') {
        phrase = "Google developers met in Seattle last Friday to discuss deep learning architectures.";
      } else if (featureType === 'summarization') {
        phrase = "Initialize neural uplink. Access logs suggest connection is secure. We need to aggregate all systems.";
      }
      
      setTranscript(phrase);
      setProcessing(false);

      // Submit transcript to prediction endpoint
      try {
        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: phrase, type: featureType }),
        });

        if (res.ok) {
          const data = await res.json();
          setResult(data);
        } else {
          throw new Error('Speech analysis failed');
        }
      } catch (err) {
        setError(err.message);
      }
    }, 2500);
  };

  return (
    <div className={styles.playground}>
      {/* Left Column: Vocal capture interface */}
      <div className={styles.inputSection}>
        <div className={styles.overviewHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <span className={styles.sysTag}>// PIPELINE: ACOUSTIC_SPEECH_TO_TEXT</span>
            <h1 className={styles.mainTitle} style={{ fontSize: '1.5rem' }}>VOCAL_TELEMETRY</h1>
          </div>
        </div>

        <div className={`${styles.inputCard} cyber-card`} style={{ marginTop: '16px', alignItems: 'center', padding: '32px' }}>
          <span className="corner-brackets" />

          <div style={{ width: '100%', marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              TARGET_TELEMETRY_PIPELINE
            </label>
            <select
              value={featureType}
              onChange={(e) => setFeatureType(e.target.value)}
              style={{
                width: '100%',
                background: '#050508',
                border: '1px solid var(--border-cyber)',
                padding: '8px 12px',
                color: '#fff',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                outline: 'none'
              }}
            >
              <option value="emotion">EMOTION_DIAGNOSTICS</option>
              <option value="sentiment">POLARITY_CONSOLE</option>
              <option value="toxicity">MODERATION_SCAN</option>
              <option value="summarization">TEXT_COMPACTOR</option>
              <option value="ner">ENTITY_EXTRACTOR</option>
            </select>
          </div>

          {/* Glowing waveform visualization canvas */}
          <div 
            style={{ 
              width: '100%', 
              height: '100px', 
              background: '#020204', 
              borderRadius: '4px', 
              border: '1px solid var(--border)', 
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '24px'
            }}
          >
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
            {recording && (
              <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.6rem', color: 'red', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>
                ● RECORDING
              </span>
            )}
          </div>

          {/* Record trigger button */}
          <button
            onClick={handleToggleRecord}
            disabled={processing}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: recording ? 'red' : 'var(--accent-indigo)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: recording ? '0 0 25px rgba(255, 0, 0, 0.4)' : '0 0 25px var(--accent-indigo-glow)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <span style={{ fontSize: '1.5rem', color: '#fff' }}>
              {recording ? '⏹️' : '🎙️'}
            </span>
          </button>
          
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '12px', fontFamily: 'var(--font-mono)' }}>
            {recording ? 'CLICK TO END CAPTURE' : 'INITIALIZE VOCAL CAPTURE'}
          </span>
        </div>

        {/* Live Transcription box */}
        <div className={`${styles.panelCard} cyber-card`} style={{ padding: '20px', width: '100%' }}>
          <span className="corner-brackets" />
          <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            // TRANSCRIBED_SPEECH_STREAM:
          </h4>
          
          <div 
            style={{ 
              background: '#020204', 
              border: '1px solid var(--border-cyber)', 
              borderRadius: '4px', 
              padding: '16px', 
              minHeight: '80px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#fff',
              lineHeight: '1.5'
            }}
          >
            {processing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
                <span className={styles.btnSpinner} />
                [STT] PROCESSING ACOUSTIC WAVEFORM...
              </div>
            ) : transcript ? (
              transcript
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Acoustic channel idle. Trigger capture to begin speech-to-text.</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Prediction results */}
      <div className={styles.resultSection}>
        {error && (
          <div className={styles.errorCard} style={{ marginBottom: '24px' }}>
            <span>[ERR_SPEECH_PIPELINE]</span>
            <p>{error}</p>
          </div>
        )}

        {result ? (
          <div className={`${styles.resultCard} cyber-card`} style={{ minHeight: '400px' }}>
            <span className="corner-brackets" />
            <h2 className={styles.panelTitle}>// ACOUSTIC_INFERENCE_REPORT</h2>

            <div className={styles.resultMain}>
              <div className={styles.resultEmoji}>
                {featureType === 'sentiment' ? (result.dominant === 'positive' ? '😊' : result.dominant === 'negative' ? '😢' : '😐') : '🧠'}
              </div>
              <div className={styles.resultInfo}>
                <span className={styles.resultLabel}>CLASSIFIED_DOMINANT_STATE:</span>
                <h3 className={styles.resultEmotion}>{result.dominant.toUpperCase()}</h3>
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

            {/* Render top3 breakdown if it is emotion type */}
            {featureType === 'emotion' && result.metadata?.top3 && (
              <div className={styles.top3}>
                <h4 className={styles.top3Title}>// SPECTRUM_DENSITY_ESTIMATOR:</h4>
                <div className={styles.top3List}>
                  {result.metadata.top3.map((item, i) => (
                    <div key={item.label} className={styles.top3Item}>
                      <span className={styles.top3Rank}>0{i + 1}.</span>
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
          </div>
        ) : (
          <div className={`${styles.emptyResult} cyber-card`} style={{ minHeight: '400px' }}>
            <span className="corner-brackets" />
            <div className={styles.emptyIcon}>🎙️</div>
            <h3>SPEECH_INFERENCE_IDLE</h3>
            <p>Deploy acoustic capture channel to process real-time voice NLP diagnostics.</p>
          </div>
        )}
      </div>
    </div>
  );
}
