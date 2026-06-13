'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { isMockAuth } from '@/lib/auth-helpers';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [operatorId, setOperatorId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [passcode, setPasscode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState([
    '[SYS] OFFLINE EVALUATION INSTANCE DETECTED',
    '[SYS] REGISTERING NEW NODES LOCALLY',
    '[SYS] INGEST PARAMETERS TO DEFINE OPERATOR'
  ]);

  const handleMockSubmit = (e) => {
    e.preventDefault();
    const opId = operatorId.trim().toLowerCase();
    const em = email.trim();
    const ph = phone.trim();
    const pass = passcode;

    if (!opId || !em || !ph || !pass) {
      setLogs((prev) => [...prev, '[ERR] MISSING CRITICAL ALLOCATION PARAMETERS']);
      return;
    }

    setSubmitting(true);
    setLogs((prev) => [...prev, `[CMD] PROVISIONING DISK SECTOR FOR OPERATOR: ${opId.toUpperCase()}`]);

    setTimeout(() => {
      // Retrieve existing mock users
      const users = JSON.parse(localStorage.getItem('emosense_users') || '[]');
      const userExists = users.some(u => u.operatorId === opId);
      
      if (userExists) {
        setLogs((prev) => [
          ...prev, 
          `[ERR] OPERATOR ID "${opId.toUpperCase()}" ALREADY ALLOCATED. ACCESS DENIED.`
        ]);
        setSubmitting(false);
        return;
      }

      // Save new user profile
      users.push({ operatorId: opId, email: em, phone: ph, passcode: pass });
      localStorage.setItem('emosense_users', JSON.stringify(users));

      setLogs((prev) => [...prev, `[SYS] WRITING DB NODE WITH ID: mock_user_${opId}`]);
      
      setTimeout(() => {
        setLogs((prev) => [...prev, '[SYS] LOCAL CREDENTIAL MATRIX ESTABLISHED. LOGGING IN...']);
        
        setTimeout(() => {
          localStorage.setItem('emosense_session', opId);
          router.push('/dashboard');
        }, 800);
      }, 500);
    }, 800);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#030304',
        padding: '24px',
        position: 'relative',
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)"
      }}
    >
      <div className="scifi-grid" />
      <div className="scanlines" />

      {isMockAuth ? (
        /* Custom styled offline console signup */
        <div 
          className="cyber-card" 
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'rgba(8, 8, 12, 0.85)',
            border: '1px solid var(--border-cyber, rgba(88, 86, 214, 0.25))',
            padding: '32px',
            borderRadius: '6px',
            boxShadow: '0 0 40px rgba(88, 86, 214, 0.1)',
            position: 'relative',
            zIndex: 10
          }}
        >
          <span className="corner-brackets" />
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '2.5rem' }}>🧠</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', letterSpacing: '1px', marginTop: '12px' }}>
              EMO_SENSE_REGISTRATION
            </h2>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #94a3b8)', letterSpacing: '1px', marginTop: '4px' }}>
              INITIALIZE NEW OPERATOR SECTOR // MOCK MODE
            </p>
          </div>

          <form onSubmit={handleMockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.5px' }}>
                DEFINE_OPERATOR_NAME
              </label>
              <input
                type="text"
                placeholder="e.g. Aaditya"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
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
                  fontFamily: 'inherit',
                  transition: '0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-indigo, #5856d6)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-cyber)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.5px' }}>
                CONTACT_EMAIL_ADDRESS
              </label>
              <input
                type="email"
                placeholder="e.g. operator@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  fontFamily: 'inherit',
                  transition: '0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-indigo)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-cyber)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.5px' }}>
                CONTACT_PHONE_NUMBER
              </label>
              <input
                type="tel"
                placeholder="e.g. +1-555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                  fontFamily: 'inherit',
                  transition: '0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-indigo)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-cyber)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.5px' }}>
                SECURE_PASSCODE // PASSCODE_STRENGTH_METER
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
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
                  fontFamily: 'inherit',
                  transition: '0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-indigo)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-cyber)'}
              />
              {passcode && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div style={{ height: '3px', flex: 1, background: passcode.length > 8 ? 'var(--accent-emerald)' : 'var(--accent-amber)', borderRadius: '10px' }} />
                  <span style={{ fontSize: '0.55rem', color: passcode.length > 8 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                    {passcode.length > 8 ? 'COMPLEXITY: ROBUST' : 'COMPLEXITY: LOW'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: 'var(--accent-indigo, #5856d6)',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: 'inherit',
                transition: '0.2s',
                marginTop: '10px',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => e.target.style.boxShadow = '0 0 15px rgba(88, 86, 214, 0.4)'}
              onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
            >
              {submitting ? 'COMPUTING_ALLOCATION...' : 'PROVISION_NODE'}
            </button>
          </form>

          {/* Terminal log window */}
          <div
            style={{
              background: '#020204',
              border: '1px solid rgba(255,255,255,0.02)',
              borderRadius: '4px',
              padding: '12px',
              marginTop: '24px',
              fontSize: '0.6rem',
              color: 'var(--text-tertiary, #64748b)',
              maxHeight: '100px',
              overflowY: 'auto',
              lineHeight: '1.4'
            }}
          >
            {logs.map((log, idx) => (
              <div key={idx} style={{ color: log.startsWith('[CMD]') ? 'var(--accent-cyan)' : log.startsWith('[ERR]') ? '#ff453a' : '' }}>
                {log}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.7rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Already have an operator node? </span>
            <Link href="/sign-in" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
              LOAD_EXISTING_SHELL &gt;
            </Link>
          </div>
        </div>
      ) : (
        /* Real Clerk Auth widget wrapped in custom glass aesthetics */
        <div 
          style={{
            zIndex: 10,
            background: 'rgba(8, 8, 12, 0.4)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            border: '1px solid var(--border-cyber)',
            padding: '10px',
            boxShadow: '0 0 45px rgba(88, 86, 214, 0.15)'
          }}
        >
          <SignUp
            appearance={{
              elements: {
                rootBox: { width: '100%', maxWidth: '440px' },
                card: { background: 'transparent', border: 'none', boxShadow: 'none' },
                headerTitle: { color: '#fff', fontFamily: 'var(--font-heading)' },
                headerSubtitle: { color: 'var(--text-secondary)' },
                socialButtonsBlockButton: { background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' },
                socialButtonsBlockButtonText: { color: '#fff' },
                dividerText: { color: 'var(--text-muted)' },
                formLabel: { color: 'var(--text-secondary)' },
                formInput: { background: '#050508', border: '1px solid var(--border-cyber)', color: '#fff' },
                formButtonPrimary: { background: 'var(--accent-indigo)' },
                footerActionText: { color: 'var(--text-secondary)' },
                footerActionLink: { color: 'var(--accent-cyan)' },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
