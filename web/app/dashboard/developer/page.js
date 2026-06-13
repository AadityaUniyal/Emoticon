'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../dashboard.module.css';

export default function DeveloperPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyName, setKeyName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [newKeyGenerated, setNewKeyGenerated] = useState(null); // to show full raw key once
  const [error, setError] = useState('');
  
  // Key audit log states
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Fetch generated developer keys
  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/developer/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (err) {
      console.error('Failed to fetch keys:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch key traffic audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/developer/logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    fetchAuditLogs();
  }, [fetchKeys, fetchAuditLogs]);

  // Create a new key
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setGenerating(true);
    setError('');
    setNewKeyGenerated(null);

    try {
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyName: keyName.trim() }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate key');
      }

      const data = await res.json();
      setNewKeyGenerated(data.api_key);
      setKeyName('');
      fetchKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Revoke an existing key
  const handleRevoke = async (id) => {
    if (!confirm('Are you sure you want to revoke this API key? External systems using it will immediately fail.')) {
      return;
    }

    try {
      const res = await fetch(`/api/developer/keys?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error('Failed to revoke key:', err);
    }
  };

  const sampleCurl = `curl -X POST http://localhost:3000/api/v1/predict \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${newKeyGenerated || 'sk_live_your_generated_key_here'}" \\
  -d '{
    "text": "I am so excited to test the external developer endpoint!",
    "type": "emotion"
  }'`;

  const sampleJs = `fetch('http://localhost:3000/api/v1/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${newKeyGenerated || 'sk_live_your_generated_key_here'}'
  },
  body: JSON.stringify({
    text: 'I am so excited to test the external developer endpoint!',
    type: 'emotion'
  })
})
.then(res => res.json())
.then(data => console.log(data));`;

  return (
    <div className={styles.playground}>
      {/* Left panel: Key Provisioner */}
      <div className={styles.inputSection}>
        <div className={styles.overviewHeader} style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <span className={styles.sysTag}>// SYSTEM: DEVELOPER_GATEWAY</span>
            <h1 className={styles.mainTitle} style={{ fontSize: '1.5rem' }}>DEVELOPER_PORTAL</h1>
          </div>
        </div>

        {/* Generate Card */}
        <div className={`${styles.inputCard} cyber-card`} style={{ marginTop: '16px' }}>
          <span className="corner-brackets" />
          <h3 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', marginBottom: '16px' }}>
            // PROVISION_NEW_API_KEY
          </h3>

          <form onSubmit={handleGenerate}>
            <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              KEY_IDENTIFIER_NAME
            </label>
            <input
              type="text"
              placeholder="e.g. Production Backend Service"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              required
              style={{
                width: '100%',
                background: '#050508',
                border: '1px solid var(--border-cyber)',
                padding: '10px 14px',
                color: '#fff',
                borderRadius: '4px',
                outline: 'none',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                transition: '0.2s',
                marginBottom: '16px'
              }}
            />

            {error && <p style={{ color: 'red', fontSize: '0.7rem', marginBottom: '12px' }}>{error}</p>}

            <button
              type="submit"
              disabled={generating || !keyName.trim()}
              className={styles.analyzeBtn}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {generating ? 'CREATING_TOKEN...' : 'GENERATE_SECURE_TOKEN'}
            </button>
          </form>

          {/* Reveal New Key Warning */}
          {newKeyGenerated && (
            <div 
              style={{
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: '4px',
                padding: '16px',
                marginTop: '20px',
                fontSize: '0.75rem'
              }}
            >
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', marginBottom: '8px' }}>
                ⚠️ SECURE TOKEN CREATED (SAVE THIS NOW):
              </div>
              <code style={{ background: '#020204', display: 'block', padding: '10px', color: '#fff', wordBreak: 'break-all', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {newKeyGenerated}
              </code>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                For security reasons, this token will not be displayed again.
              </p>
            </div>
          )}
        </div>

        {/* Integration Instructions */}
        <div className={`${styles.panelCard} cyber-card`} style={{ padding: '20px', marginTop: '24px' }}>
          <span className="corner-brackets" />
          <h3 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', marginBottom: '16px' }}>
            // API_INTEGRATION_GUIDE
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>COMMAND_LINE (CURL):</span>
              <pre style={{ background: '#020204', padding: '12px', borderRadius: '4px', fontSize: '0.65rem', border: '1px solid var(--border)', overflowX: 'auto', marginTop: '6px', color: '#88a' }}>
                {sampleCurl}
              </pre>
            </div>

            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>JAVASCRIPT (FETCH):</span>
              <pre style={{ background: '#020204', padding: '12px', borderRadius: '4px', fontSize: '0.65rem', border: '1px solid var(--border)', overflowX: 'auto', marginTop: '6px', color: '#88a' }}>
                {sampleJs}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Active Keys & Audit Logs */}
      <div className={styles.resultSection}>
        <div className={`${styles.panelCard} cyber-card`} style={{ minHeight: '350px' }}>
          <span className="corner-brackets" />
          <h2 className={styles.panelTitle}>// ACTIVE_DEVELOPER_TOKENS</h2>

          {loading ? (
            <div className={styles.terminalEmpty}>QUERYING_GATEWAY_RECORDS...</div>
          ) : keys.length === 0 ? (
            <div className={styles.terminalEmpty}>NO ACTIVE API KEYS DETECTED. GENERATE A SECURE TOKEN TO BEGIN.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table} style={{ width: '100%', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px' }}>KEY_IDENTIFIER</th>
                    <th style={{ padding: '8px' }}>TOKEN_MASK</th>
                    <th style={{ padding: '8px' }}>LAST_USED</th>
                    <th style={{ padding: '8px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '8px', color: '#fff', fontWeight: 'bold' }}>{k.key_name}</td>
                      <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                        {k.api_key.slice(0, 12)}...{k.api_key.slice(-4)}
                      </td>
                      <td style={{ padding: '8px', color: k.last_used_at ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'NEVER'}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <button
                          onClick={() => handleRevoke(k.id)}
                          style={{
                            background: 'rgba(255, 0, 0, 0.1)',
                            border: '1px solid red',
                            color: 'red',
                            fontSize: '0.65rem',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          REVOKE_KEY
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit Logs Table */}
        <div className={`${styles.panelCard} cyber-card`} style={{ marginTop: '24px' }}>
          <span className="corner-brackets" />
          <h2 className={styles.panelTitle}>// KEY_TRAFFIC_AUDIT_LOGS</h2>
          
          {loadingLogs ? (
            <div className={styles.terminalEmpty}>QUERYING_TRAFFIC_RECORDS...</div>
          ) : auditLogs.length === 0 ? (
            <div className={styles.terminalEmpty}>NO API TRAFFIC RECORDED YET.</div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <table className={styles.table} style={{ width: '100%', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px' }}>KEY_NAME</th>
                    <th style={{ padding: '8px' }}>FEATURE</th>
                    <th style={{ padding: '8px' }}>LATENCY</th>
                    <th style={{ padding: '8px' }}>STATUS</th>
                    <th style={{ padding: '8px' }}>IP_ADDRESS</th>
                    <th style={{ padding: '8px' }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => {
                    const isSuccess = log.statusCode === 200;
                    const isRateLimit = log.statusCode === 429;
                    const statusColor = isSuccess ? '#30d158' : isRateLimit ? '#ff9f0a' : '#ff453a';
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '8px', color: '#fff', fontWeight: 'bold' }}>{log.keyName}</td>
                        <td style={{ padding: '8px', color: 'var(--accent-indigo)' }}>{log.featureType.toUpperCase()}</td>
                        <td style={{ padding: '8px' }}>{log.latencyMs}ms</td>
                        <td style={{ padding: '8px', color: statusColor, fontWeight: 'bold' }}>{log.statusCode}</td>
                        <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{log.ipAddress}</td>
                        <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                          {new Date(log.createdAt).toLocaleTimeString()}
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
