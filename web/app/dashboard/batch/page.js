'use client';

import { useState } from 'react';
import styles from '../dashboard.module.css';

export default function BatchPage() {
  const [featureType, setFeatureType] = useState('emotion');
  const [rawText, setRawText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  // Handle batch file uploading & parsing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target.result;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const list = Array.isArray(parsed) ? parsed : (parsed.texts || Object.values(parsed));
          setRawText(list.map(item => typeof item === 'string' ? item : (item.text || JSON.stringify(item))).join('\n'));
          setLogs([`[FILE] Loaded JSON batch: ${file.name} (${list.length} rows)`]);
        } else {
          // CSV / TXT split by lines
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
          setRawText(lines.join('\n'));
          setLogs([`[FILE] Loaded CSV/TXT batch: ${file.name} (${lines.length} rows)`]);
        }
      } catch (err) {
        setError(`Failed to parse file: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  const handleProcess = async () => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      setError('Please provide text sequences to process.');
      return;
    }

    setProcessing(true);
    setError('');
    setResults([]);
    setLogs((prev) => [
      ...prev,
      `[CMD] INGESTING BATCH PAYLOAD // SIZE: ${lines.length} VECTORS`,
      `[SYS] DISPATCHING BATCH TO PIPELINE [TYPE: ${featureType.toUpperCase()}]`
    ]);

    try {
      const res = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: lines, type: featureType }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Batch processing failed');
      }

      const data = await res.json();
      
      setLogs((prev) => [
        ...prev,
        `[SYS] COMPLETED BATCH PROCESSING SUCCESSFULLY`,
        `[SYS] WRITTEN ${data.processed} RECORDS TO NEON POSTGRESQL`,
        `[SYS] DUPLICATED RECORDS IN web/predictions.csv LOCAL AUDIT LOG`
      ]);

      setResults(data.results);
    } catch (err) {
      setError(err.message);
      setLogs((prev) => [...prev, `[ERR] PIPELINE EXCEPTION: ${err.message}`]);
    } finally {
      setProcessing(false);
    }
  };

  // Export results as CSV
  const handleExport = () => {
    if (results.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Text,Dominant_Output,Confidence\n';

    results.forEach((r) => {
      const escapedText = `"${r.text.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
      const escapedOutput = `"${r.dominant.replace(/"/g, '""')}"`;
      csvContent += `${escapText},${escapOutput},${r.confidence}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `emosense_batch_${featureType}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.playground}>
      {/* Left panel: Batch inputs */}
      <div className={styles.inputSection}>
        <div className={styles.overviewHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <span className={styles.sysTag}>// PIPELINE: ASYNC_BATCH_INGESTOR</span>
            <h1 className={styles.mainTitle} style={{ fontSize: '1.5rem' }}>BATCH_PROCESSING_CONSOLE</h1>
          </div>
        </div>

        <div className={`${styles.inputCard} cyber-card`} style={{ marginTop: '16px' }}>
          <span className="corner-brackets" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                TELEMETRY_PIPELINE
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

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                LOAD_DATASET_FILE (.CSV / .JSON / .TXT)
              </label>
              <input
                type="file"
                accept=".csv,.json,.txt"
                onChange={handleFileUpload}
                style={{
                  width: '100%',
                  background: '#050508',
                  border: '1px solid var(--border-cyber)',
                  padding: '6px 12px',
                  color: '#fff',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          <div className={styles.cardInfo}>
            <label className={styles.inputLabel}>
              RAW_TEXT_VECTORS // ONE_SEQUENCE_PER_LINE
              <span className={styles.charCount}>
                {rawText.split('\n').filter(Boolean).length} vectors
              </span>
            </label>
          </div>
          <textarea
            className={styles.textarea}
            placeholder="Type, paste, or load text vectors (one sequence per line)..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            maxLength={20000}
            rows={10}
            style={{ fontSize: '0.75rem' }}
          />

          <div className={styles.inputActions}>
            <span className={styles.shortcutHint}>MAXIMUM BATCH SIZE: 100 RECORDS</span>
            <button
              className={styles.analyzeBtn}
              onClick={handleProcess}
              disabled={processing || !rawText.trim()}
            >
              {processing ? (
                <>
                  <span className={styles.btnSpinner} />
                  PROCESSING...
                </>
              ) : (
                'LAUNCH_BATCH_PIPELINE'
              )}
            </button>
          </div>
        </div>

        {/* Live Terminal Progress Log */}
        <div className={`${styles.panelCard} cyber-card`} style={{ padding: '16px' }}>
          <span className="corner-brackets" />
          <h4 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            // PIPELINE_EXECUTION_STREAMS:
          </h4>
          <div className={styles.terminalContainer} style={{ maxHeight: '150px', background: '#020204' }}>
            {logs.length === 0 ? (
              <div className={styles.terminalEmpty}>WAITING FOR WORKLOAD BATCH PACKETS...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className={styles.terminalLine} style={{ color: log.startsWith('[ERR]') ? 'red' : '' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right panel: Results display */}
      <div className={styles.resultSection}>
        {error && (
          <div className={styles.errorCard} style={{ marginBottom: '24px' }}>
            <span>[ERR_BATCH_EXCEPTION]</span>
            <p>{error}</p>
          </div>
        )}

        {results.length > 0 ? (
          <div className={`${styles.panelCard} cyber-card`} style={{ minHeight: '400px' }}>
            <span className="corner-brackets" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px dashed var(--border)', paddingBottom: '10px' }}>
              <h2 className={styles.panelTitle} style={{ marginBottom: 0 }}>
                // PROCESSED_BATCH_VECTORS
              </h2>
              <button 
                onClick={handleExport}
                className={styles.launchLink}
                style={{ background: 'rgba(6, 182, 212, 0.05)', borderColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              >
                DOWNLOAD_RESULTS_CSV &gt;
              </button>
            </div>

            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table className={styles.table} style={{ width: '100%', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px' }}>SEQUENCE_TEXT</th>
                    <th style={{ padding: '8px' }}>PREDICTED_OUTPUT</th>
                    <th style={{ padding: '8px' }}>CONFIDENCE</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                        {r.text.length > 50 ? r.text.slice(0, 50) + '...' : r.text}
                      </td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                        {r.dominant.toUpperCase()}
                      </td>
                      <td style={{ padding: '8px' }}>{Math.round(r.confidence * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={`${styles.emptyResult} cyber-card`} style={{ minHeight: '400px' }}>
            <span className="corner-brackets" />
            <div className={styles.emptyIcon}>📂</div>
            <h3>PIPELINE_IDLE</h3>
            <p>Ingest a text vector payload using the configuration panel to deploy classification metrics.</p>
          </div>
        )}
      </div>
    </div>
  );
}
