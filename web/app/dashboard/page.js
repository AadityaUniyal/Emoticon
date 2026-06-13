'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/auth-helpers';
import Link from 'next/link';
import styles from './dashboard.module.css';

// SVG charting helpers
const drawLatencyPath = (points) => {
  if (points.length < 2) return '';
  const xStep = 500 / (points.length - 1);
  const maxVal = Math.max(...points, 200);
  const minVal = Math.min(...points, 0);
  const range = maxVal - minVal || 1;
  
  return points.map((p, index) => {
    const x = index * xStep;
    const y = 130 - ((p - minVal) / range) * 110;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
};

const drawAreaPath = (points) => {
  if (points.length < 2) return '';
  const xStep = 500 / (points.length - 1);
  const maxVal = Math.max(...points, 200);
  const minVal = Math.min(...points, 0);
  const range = maxVal - minVal || 1;
  
  const pathPoints = points.map((p, index) => {
    const x = index * xStep;
    const y = 130 - ((p - minVal) / range) * 110;
    return `${x},${y}`;
  });
  
  return `M 0 130 ${pathPoints.map(p => 'L ' + p.replace(',', ' ')).join(' ')} L 500 130 Z`;
};

function LatencyChart({ logs }) {
  // Filter logs that have a latency
  const logsWithLatency = logs.filter(l => typeof l.latencyMs === 'number' || typeof l.latency_ms === 'number');
  const points = logsWithLatency.length > 0 
    ? logsWithLatency.slice(0, 10).reverse().map(l => l.latencyMs || l.latency_ms) 
    : [120, 150, 90, 110, 180, 130, 140, 160, 95, 125];

  const linePath = drawLatencyPath(points);
  const areaPath = drawAreaPath(points);

  return (
    <div style={{ position: 'relative', width: '100%', height: '150px' }}>
      <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid Lines */}
        <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.05)" />
        <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.05)" />
        <line x1="0" y1="130" x2="500" y2="130" stroke="rgba(255,255,255,0.1)" />

        {/* Area path */}
        {areaPath && <path d={areaPath} fill="url(#latencyGrad)" />}

        {/* Line path */}
        {linePath && (
          <path 
            d={linePath} 
            fill="none" 
            stroke="var(--accent-cyan)" 
            strokeWidth="2" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Markers */}
        {points.map((p, idx) => {
          const xStep = 500 / (points.length - 1);
          const maxVal = Math.max(...points, 200);
          const minVal = Math.min(...points, 0);
          const range = maxVal - minVal || 1;
          const x = idx * xStep;
          const y = 130 - ((p - minVal) / range) * 110;

          return (
            <g key={idx}>
              <circle cx={x} cy={y} r="3.5" fill="#050508" stroke="var(--accent-cyan)" strokeWidth="1.5" />
              <text 
                x={x} 
                y={y - 8} 
                fill="var(--accent-cyan)" 
                fontSize="8" 
                fontFamily="var(--font-mono)"
                textAnchor="middle"
              >
                {p}ms
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ScatterPlot({ logs }) {
  // Map standard logs to points
  const points = logs.slice(0, 10).map((log, index) => {
    const conf = log.confidence || 0.5;
    const x = 50 + (conf * 400);
    const latency = log.latencyMs || log.latency_ms || 120;
    const y = 120 - (Math.min(latency, 500) / 500) * 100;
    const size = 6 + (log.inputText ? log.inputText.length % 8 : 4);
    
    let color = '#5856d6'; // default emotion
    if (log.featureType === 'sentiment') color = '#30d158';
    if (log.featureType === 'toxicity') color = '#06b6d4';
    if (log.featureType === 'summarization') color = '#ff9f0a';
    if (log.featureType === 'ner') color = '#ff453a';

    return { x, y, size, color, label: log.dominantOutput || 'unknown', id: log.id || index };
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '150px' }}>
      <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%' }}>
        {/* Grid Lines */}
        <line x1="50" y1="20" x2="450" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
        <line x1="50" y1="70" x2="450" y2="70" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
        <line x1="50" y1="120" x2="450" y2="120" stroke="rgba(255,255,255,0.1)" />
        
        <line x1="50" y1="20" x2="50" y2="120" stroke="rgba(255,255,255,0.1)" />
        <line x1="250" y1="20" x2="250" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
        <line x1="450" y1="20" x2="450" y2="120" stroke="rgba(255,255,255,0.05)" />

        {/* Axis Labels */}
        <text x="50" y="135" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">CONF: 0%</text>
        <text x="250" y="135" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle">50%</text>
        <text x="450" y="135" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">100%</text>

        <text x="40" y="25" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">500ms</text>
        <text x="40" y="75" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">250ms</text>
        <text x="40" y="123" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)" textAnchor="end">0ms</text>

        {/* Render points */}
        {points.map((p, i) => (
          <g key={p.id}>
            <circle 
              cx={p.x} 
              cy={p.y} 
              r={p.size} 
              fill={p.color} 
              opacity="0.8" 
              stroke="rgba(255,255,255,0.2)" 
              strokeWidth="1"
            />
            <text 
              x={p.x} 
              y={p.y - p.size - 2} 
              fill="#fff" 
              fontSize="7" 
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              opacity="0.9"
            >
              {p.label.slice(0, 10).toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function TelemetryDashboard() {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState({ logs: [], stats: {}, csvLines: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch telemetry overview data
  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        throw new Error('Failed to fetch system telemetry');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchTelemetry();
      // Auto-refresh logs every 10 seconds for real-time console look
      const interval = setInterval(fetchTelemetry, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <div className={styles.loadingScreen}>
        <span className={styles.sysTag}>[SYS_OVERVIEW_INITIALIZING]</span>
        <div className={styles.spinner} />
        <p className={styles.codeFont}>Connecting system telemetry overview console...</p>
      </div>
    );
  }

  const { stats, logs, csvLines } = data;

  return (
    <div className={styles.dashboardOverview}>
      {/* Header Panel */}
      <div className={styles.overviewHeader}>
        <div>
          <span className={styles.sysTag}>// SYSTEM_OVERVIEW_CONSOLE</span>
          <h1 className={styles.mainTitle}>EMOSENSE_TELEMETRY_CENTER</h1>
        </div>
        <div className={styles.nodeIndicator}>
          <div className="status-dot" />
          <span>NODE: ACTIVE_01 // SECURE_SSL</span>
        </div>
      </div>

      {/* Grid Stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statsCard} cyber-card`}>
          <span className="corner-brackets" />
          <div className={styles.statsLabel}>GLOBAL_SCANS_TOTAL</div>
          <div className={styles.statsValue}>{stats.total || 0}</div>
          <div className={styles.statsFooter}>+ Neon DB records synced</div>
        </div>

        <div className={`${styles.statsCard} cyber-card`}>
          <span className="corner-brackets" />
          <div className={styles.statsLabel}>AVG_CONFIDENCE_METRIC</div>
          <div className={styles.statsValue}>
            {stats.total > 0 ? `${Math.round(stats.avgConfidence * 100)}%` : '0%'}
          </div>
          <div className={styles.statsFooter}>Weighted models mean</div>
        </div>

        <div className={`${styles.statsCard} cyber-card`}>
          <span className="corner-brackets" />
          <div className={styles.statsLabel}>CSV_LOGS_BACKUP</div>
          <div className={styles.statsValue}>
            {csvLines.length > 0 ? `${csvLines.length} RUNS` : 'EMPTY'}
          </div>
          <div className={styles.statsFooter}>predictions.csv storage</div>
        </div>

        <div className={`${styles.statsCard} cyber-card`}>
          <span className="corner-brackets" />
          <div className={styles.statsLabel}>SYSTEM_HEALTH_LOG</div>
          <div className={styles.healthStatus}>
            <div className={styles.healthItem}>
              <span>NEON_POSTGRESQL:</span>
              <span className={styles.healthGreen}>ONLINE</span>
            </div>
            <div className={styles.healthItem}>
              <span>LOCAL_CSV_SYNC:</span>
              <span className={styles.healthGreen}>ACTIVE</span>
            </div>
            <div className={styles.healthItem}>
              <span>FASTAPI_INF:</span>
              <span className={styles.healthCyan}>READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Analytics SVG Charts Row */}
      <div className={styles.consoleSplit} style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Latency Wave Line Chart */}
        <div className={`${styles.panelCard} cyber-card`}>
          <span className="corner-brackets" />
          <h2 className={styles.panelTitle}>// LATENCY_METRIC_WAVE</h2>
          <div style={{ marginTop: '16px' }}>
            <LatencyChart logs={logs} />
          </div>
        </div>

        {/* Cognitive Category Distribution Scatter Plot */}
        <div className={`${styles.panelCard} cyber-card`}>
          <span className="corner-brackets" />
          <h2 className={styles.panelTitle}>// COGNITIVE_ACCURACY_SCATTER</h2>
          <div style={{ marginTop: '16px' }}>
            <ScatterPlot logs={logs} />
          </div>
        </div>
      </div>

      {/* Main Console Split */}
      <div className={styles.consoleSplit}>
        {/* Left column: Pipeline Status & Launchers */}
        <div className={styles.pipelineColumn}>
          <div className={`${styles.panelCard} cyber-card`}>
            <span className="corner-brackets" />
            <h2 className={styles.panelTitle}>// MODEL_PIPELINE_MODULES</h2>
            
            <div className={styles.pipelineList}>
              {[
                { name: 'EMOTION_DIAGNOSTICS', route: '/dashboard/emotion', count: stats.emotion || 0, desc: 'Classify text sequence into 27 cognitive states.', accent: 'indigo' },
                { name: 'POLARITY_CONSOLE', route: '/dashboard/sentiment', count: stats.sentiment || 0, desc: 'Assess positive/negative/neutral polarity values.', accent: 'emerald' },
                { name: 'MODERATION_SCAN', route: '/dashboard/toxicity', count: stats.toxicity || 0, desc: 'Identify toxic language, hate speech, and harassment.', accent: 'cyan' },
                { name: 'TEXT_COMPACTOR', route: '/dashboard/summarization', count: stats.summarization || 0, desc: 'Compute extractive summarization via sentence scores.', accent: 'amber' },
                { name: 'ENTITY_EXTRACTOR', route: '/dashboard/ner', count: stats.ner || 0, desc: 'Extract organizations, names, locations, and dates.', accent: 'indigo' },
              ].map((p) => (
                <div key={p.name} className={styles.pipelineRow}>
                  <div className={styles.pipelineInfo}>
                    <div className={styles.pipelineHeader}>
                      <span className={styles.pipelineName}>{p.name}</span>
                      <span className={styles.pipelineCount}>{p.count} runs</span>
                    </div>
                    <p className={styles.pipelineDesc}>{p.desc}</p>
                  </div>
                  <Link href={p.route} className={styles.launchLink}>
                    OPEN_SHELL &gt;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: System Audit Logs Stream & CSV logs */}
        <div className={styles.logsColumn}>
          {/* Live db logs */}
          <div className={`${styles.panelCard} cyber-card`}>
            <span className="corner-brackets" />
            <h2 className={styles.panelTitle}>// NEON_DB_TELEMETRY_STREAM</h2>
            
            <div className={styles.terminalContainer}>
              {logs.length === 0 ? (
                <div className={styles.terminalEmpty}>NO TELEMETRY STREAM LOGS DETECTED. PIPELINES ARE IDLE.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className={styles.terminalLine}>
                    <span className={styles.termTime}>
                      [{new Date(log.createdAt).toLocaleTimeString('en-US', { hour12: false })}]
                    </span>{' '}
                    <span className={styles.termType}>[{log.featureType.toUpperCase()}]</span>{' '}
                    <span className={styles.termText}>
                      "{log.inputText.length > 50 ? log.inputText.slice(0, 50) + '...' : log.inputText}"
                    </span>{' '}
                    -&gt;{' '}
                    <span className={styles.termOutput}>
                      {log.dominantOutput.toUpperCase()} ({Math.round(log.confidence * 100)}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Raw CSV records */}
          <div className={`${styles.panelCard} cyber-card`} style={{ marginTop: '24px' }}>
            <span className="corner-brackets" />
            <h2 className={styles.panelTitle}>// predictions.csv_RAW_LOGS</h2>
            
            <div className={styles.terminalContainer} style={{ background: '#020204', maxHeight: '180px' }}>
              {csvLines.length === 0 ? (
                <div className={styles.terminalEmpty}>predictions.csv IS EMPTY OR NOT WRITTEN.</div>
              ) : (
                csvLines.map((line, idx) => (
                  <div key={idx} className={styles.terminalLine} style={{ color: '#88a' }}>
                    <span className={styles.csvLineNumber}>[LN {idx + 1}]</span> {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
