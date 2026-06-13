'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './page.module.css';

const DEMO_EMOTIONS = [
  { label: 'admiration', score: 0.92, emoji: '🤩' },
  { label: 'optimism', score: 0.05, emoji: '🌟' },
  { label: 'curiosity', score: 0.03, emoji: '🤔' },
];

const FEATURES = [
  {
    code: 'SYS_01',
    title: '27 Cognitive States',
    desc: 'Deep multi-class emotion classification using Google\'s GoEmotions taxonomy. Captures subtle nuances from admiration to remorse.',
    glowColor: 'indigo',
  },
  {
    code: 'SYS_02',
    title: 'Sub-50ms Latency',
    desc: 'Fast inference pipelines powered by an optimized DistilBERT classifier. Built for low-overhead real-time event streaming.',
    glowColor: 'cyan',
  },
  {
    code: 'SYS_03',
    title: 'PostgreSQL Audit Logs',
    desc: 'Historical prediction logs preserved dynamically on Neon PostgreSQL serverless instances with custom indices for fast user telemetry.',
    glowColor: 'emerald',
  },
  {
    code: 'SYS_04',
    title: 'Production Decoupled API',
    desc: 'Fully standalone FastAPI + PyTorch serving layer running concurrently with Next.js App Router for enterprise scalability.',
    glowColor: 'amber',
  },
];

const METADATA_LOGS = [
  'Initializing telemetry shell...',
  'Connecting database node: neon-us-east-1...',
  'Model state: distilbert-base-uncased loaded (eval mode)',
  'FastAPI server: online on port 8000',
  'Prediction channel: active',
];

export default function LandingPage() {
  const [terminalText, setTerminalText] = useState('');
  const [terminalLog, setTerminalLog] = useState([]);
  const [demoState, setDemoState] = useState('idle'); // idle -> typing -> analyzing -> done

  // Telemetry simulator loop
  useEffect(() => {
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < METADATA_LOGS.length) {
        setTerminalLog((prev) => [...prev, `[SYS] ${METADATA_LOGS[logIndex]}`]);
        logIndex++;
      } else {
        clearInterval(logInterval);
        startDemoSequence();
      }
    }, 800);

    return () => clearInterval(logInterval);
  }, []);

  const startDemoSequence = () => {
    setDemoState('typing');
    const fullText = 'The team at DeepMind did an outstanding job on this project. Extremely impressive!';
    let charIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (charIndex < fullText.length) {
        setTerminalText((prev) => prev + fullText[charIndex]);
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setDemoState('analyzing');
        setTimeout(() => {
          setDemoState('done');
        }, 1500);
      }
    }, 40);
  };

  return (
    <main className={styles.main}>
      <Navbar />

      {/* ─── Hero Section ─── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className="status-dot" />
            <span className={styles.codeFont}>SYS_STATUS: ACTIVE // CLASSIFIER_ONLINE</span>
          </div>
          <h1 className={styles.heroTitle}>
            COGNITIVE EMOTION<br />
            <span className={styles.heroGradient}>TELEMETRY ENGINE</span>
          </h1>
          <p className={styles.heroSub}>
            Analyze natural language text across 27 distinct dimensions of emotion. 
            Move beyond simple positive/negative sentiment into high-fidelity cognitive insights.
          </p>
          <div className={styles.heroCtas}>
            <a href="/sign-up" className={styles.ctaPrimary}>
              INITIALIZE_CONSOLE
              <span className={styles.ctaArrow}>&gt;</span>
              <span className="corner-brackets" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaSecondary}
            >
              // VIEW_SOURCE
            </a>
          </div>
        </div>

        {/* ─── Antigravity Interactive Console Demo ─── */}
        <div className={styles.demoPanel}>
          <div className={styles.demoWindow}>
            <div className={styles.demoHeader}>
              <div className={styles.terminalIcon}>⌨️</div>
              <span className={styles.demoTitle}>sys_telemetry_terminal.sh</span>
              <div className={styles.systemLoad}>
                CPU: <span className={styles.glowTextGreen}>1.4%</span>
              </div>
            </div>
            <div className={styles.demoBody}>
              {/* Initial Boot logs */}
              <div className={styles.logsArea}>
                {terminalLog.map((log, index) => (
                  <div key={index} className={styles.logLine}>{log}</div>
                ))}
              </div>

              {/* Console Input Area */}
              <div className={styles.inputArea}>
                <span className={styles.prompt}>$ predict --text</span>
                <span className={styles.inputText}>
                  {terminalText}
                  {demoState === 'typing' && <span className={styles.cursor}>_</span>}
                </span>
              </div>

              {/* Analyzer Scan overlay */}
              {demoState === 'analyzing' && (
                <div className={styles.scanningOverlay}>
                  <div className="scanner-beam" />
                  <div className={styles.scanText}>ANALYZING COGNITIVE FREQUENCIES...</div>
                </div>
              )}

              {/* Result output */}
              {demoState === 'done' && (
                <div className={styles.resultArea}>
                  <div className={styles.resultMain}>
                    <div className={styles.resultEmoji}>🤩</div>
                    <div className={styles.resultInfo}>
                      <div className={styles.resultHeader}>
                        <span className={styles.resultLabel}>DOMINANT_STATE:</span>
                        <span className={styles.resultVal}>admiration</span>
                      </div>
                      <div className={styles.confidenceBarWrap}>
                        <div className={styles.confidenceBar} style={{ width: '92%' }} />
                      </div>
                      <div className={styles.resultMeta}>
                        <span>CONFIDENCE: 92%</span>
                        <span>LATENCY: 42ms</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.top3Area}>
                    <div className={styles.top3Title}>// DETECTED_COGNITIVE_SPECTRUM:</div>
                    {DEMO_EMOTIONS.map((e, index) => (
                      <div key={e.label} className={styles.top3Item}>
                        <span className={styles.rank}>0{index + 1}.</span>
                        <span className={styles.emoji}>{e.emoji}</span>
                        <span className={styles.label}>{e.label}</span>
                        <span className={styles.dots}>......................................</span>
                        <span className={styles.val}>{Math.round(e.score * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tech Stack badging ─── */}
      <section className={styles.badges}>
        <p className={styles.badgesLabel}>// INTEGRATED_MODULES</p>
        <div className={styles.badgesGrid}>
          {[
            { name: 'HuggingFace', icon: '🤗' },
            { name: 'PyTorch', icon: '🔥' },
            { name: 'Next.js 16', icon: '▲' },
            { name: 'Clerk Auth', icon: '🔐' },
            { name: 'Neon DB', icon: '🐘' },
            { name: 'FastAPI', icon: '⚡' },
          ].map((b) => (
            <div key={b.name} className={styles.badge}>
              <span className={styles.badgeIcon}>{b.icon}</span>
              <span className={styles.badgeName}>{b.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Bento Grid Features ─── */}
      <section className={styles.features} id="features">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>FEATURES_MANIFEST</span>
          <h2 className={styles.sectionTitle}>
            ENGINEERING SPECIFICATIONS
          </h2>
          <p className={styles.sectionSub}>
            Engineered with deep transformer layers and serverless infrastructure for optimized inference execution.
          </p>
        </div>
        <div className={styles.bentoGrid}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`${styles.bentoCard} ${styles[`card-${f.glowColor}`]} cyber-card`}
            >
              <span className="corner-brackets" />
              <div className={styles.cardHeader}>
                <span className={styles.cardCode}>{f.code}</span>
                <div className="status-dot" style={{ backgroundColor: `var(--accent-${f.glowColor})` }} />
              </div>
              <h3 className={styles.bentoTitle}>{f.title}</h3>
              <p className={styles.bentoDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Action Block / CTA ─── */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>
            INITIALIZE YOUR COGNITIVE SESSION
          </h2>
          <p className={styles.ctaSub}>
            Access the diagnostics dashboard and begin sequence modeling in real-time.
          </p>
          <a href="/sign-up" className={styles.ctaPrimary}>
            LAUNCH_EMOTION_CONSOLE
            <span className={styles.ctaArrow}>&gt;&gt;</span>
            <span className="corner-brackets" />
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
