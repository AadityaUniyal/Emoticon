'use client';

import { useState, useRef, useEffect } from 'react';
import styles from '../dashboard.module.css';

export default function TerminalPage() {
  const [history, setHistory] = useState([
    'EMOSENSE COGNITIVE GATEWAY CORE v2.1.0',
    'CONNECTIVITY LOGGED VIA NODE: ACTIVE_01',
    'Type "help" to list available commands.',
    ''
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const terminalEndRef = useRef(null);

  // Auto-scroll to bottom of terminal stdout
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = async (rawCmd) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    // Add to cmd history
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIdx(-1);

    const stdoutLines = [`> ${trimmed}`];
    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();

    switch (command) {
      case 'help':
        stdoutLines.push(
          'Available commands:',
          '  help                               Displays this menu.',
          '  clear                              Clears the terminal screen.',
          '  sysinfo                            Prints target system hardware metrics.',
          '  keys                               Fetches active API key identifiers.',
          '  predict --type <type> --text "<text>"  Executes a diagnostics scan.',
          '                                     Types: emotion, sentiment, toxicity, summarization, ner',
          '  matrix                             Executes digital matrix code rainfall.'
        );
        break;

      case 'clear':
        setHistory([]);
        return;

      case 'sysinfo':
        stdoutLines.push(
          'SYS_UPTIME: 104h 12m 30s',
          'DB_TARGET: Neon Serverless PostgreSQL',
          'SSL_MODE: require (rejectUnauthorized=false)',
          'MODEL_ENGINE: DistilBERT CLF (GoEmotions)',
          'HOST: localhost:3000'
        );
        break;

      case 'keys':
        try {
          const res = await fetch('/api/developer/keys');
          if (res.ok) {
            const data = await res.json();
            if (data.length === 0) {
              stdoutLines.push('No active API keys found.');
            } else {
              data.forEach(k => {
                stdoutLines.push(`- Key Name: "${k.key_name}" | Token: ${k.api_key.slice(0, 10)}...`);
              });
            }
          } else {
            stdoutLines.push('[ERR] Failed to query developer key records.');
          }
        } catch (e) {
          stdoutLines.push(`[ERR] Connectivity error: ${e.message}`);
        }
        break;

      case 'matrix':
        stdoutLines.push(
          '01010110 01001001 01010010 01010100 01010101 01000001 01001100',
          '01001101 01000001 01010100 01010010 01001001 01011000 00100000',
          '01000001 01000011 01010100 01001001 01010110 01000001 01010100',
          '01000101 01000100 00100000 01010011 01011001 01010011 01010100',
          '███████████████████████████████████████████████████████████████',
          'SYSTEM CODE STREAM ESTABLISHED // SECURE NODE DISCONNECTED'
        );
        break;

      case 'predict':
        // Extremely basic command-line parser: predict --type emotion --text "i love this"
        const typeIdx = parts.indexOf('--type');
        const textIdx = parts.indexOf('--text');

        if (typeIdx === -1 || textIdx === -1 || typeIdx + 1 >= parts.length) {
          stdoutLines.push('[ERR] Invalid arguments. Syntax: predict --type <type> --text "<text>"');
          break;
        }

        const type = parts[typeIdx + 1].toLowerCase();
        
        // Extract text inside quotes
        const rawTextMatch = trimmed.match(/--text\s+"([^"]+)"/) || trimmed.match(/--text\s+'([^']+)'/) || trimmed.match(/--text\s+(.+)$/);
        const text = rawTextMatch ? rawTextMatch[1] : '';

        if (!text) {
          stdoutLines.push('[ERR] Invalid sequence text. Ensure sequence is wrapped in double quotes.');
          break;
        }

        stdoutLines.push(`[SYS] Dispatching text to pipeline [Type: ${type.toUpperCase()}]...`);

        try {
          const res = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, type })
          });

          if (res.ok) {
            const data = await res.json();
            stdoutLines.push(
              `[SYS] Inference output generated successfully:`,
              `  - Dominant Output: "${data.dominant.toUpperCase()}"`,
              `  - Confidence: ${Math.round(data.confidence * 100)}%`,
              `  - Model Source: "${data.source.toUpperCase()}"`,
              `  - Inference Latency: ${data.latency_ms}ms`
            );
          } else {
            const errData = await res.json();
            stdoutLines.push(`[ERR] Pipeline failed: ${errData.error}`);
          }
        } catch (e) {
          stdoutLines.push(`[ERR] Network connection failure: ${e.message}`);
        }
        break;

      default:
        stdoutLines.push(`Command not recognized: "${command}". Type "help" for valid command options.`);
    }

    setHistory(prev => [...prev, ...stdoutLines, '']);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleCommand(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIdx === -1 ? commandHistory.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInput(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIdx(-1);
        setInput('');
      } else {
        setHistoryIdx(nextIdx);
        setInput(commandHistory[nextIdx]);
      }
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={styles.overviewHeader} style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '20px' }}>
        <div>
          <span className={styles.sysTag}>// CONSOLE: MONOSPACE_CRT_EMULATOR</span>
          <h1 className={styles.mainTitle} style={{ fontSize: '1.5rem' }}>CONSOLE_SHELL</h1>
        </div>
      </div>

      <div 
        className="cyber-card" 
        style={{
          flex: 1,
          background: '#010102',
          border: '1px solid var(--border-cyber)',
          borderRadius: '6px',
          padding: '24px',
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: '0.8rem',
          color: '#10b981', // green phosphor look
          boxShadow: 'inset 0 0 30px rgba(16, 185, 129, 0.08), 0 0 20px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* CRT Scanline flickering simulation */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
          zIndex: 5
        }} />

        {/* Stdout area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          marginBottom: '16px',
          paddingRight: '8px'
        }}>
          {history.map((line, idx) => (
            <div 
              key={idx} 
              style={{ 
                minHeight: '1.2em',
                whiteSpace: 'pre-wrap',
                color: line.startsWith('>') ? '#6366f1' : (line.startsWith('[ERR]') ? 'red' : '')
              }}
            >
              {line}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Stdin prompt */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', borderTop: '1px dashed rgba(16, 185, 129, 0.2)', paddingTop: '16px', position: 'relative', zIndex: 10 }}>
          <span style={{ marginRight: '8px', color: '#6366f1', fontWeight: 'bold' }}>&gt;</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#10b981',
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
          />
        </form>
      </div>
    </div>
  );
}
