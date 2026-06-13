'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { isMockAuth } from '@/lib/auth-helpers';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const [operatorId, setOperatorId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState([
    '[SYS] OFFLINE EVALUATION INSTANCE DETECTED',
    '[SYS] CLERK AUTHENTICATION BYPASSED',
    '[SYS] INPUT REGISTERED CODE AND PASSCODE TO LOGIN'
  ]);

  // Forgot Password / OTP Flow States
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: request details/send otp, 2: verify otp, 3: set new password
  const [otpMethod, setOtpMethod] = useState('email'); // 'email' or 'phone'
  const [forgotOperatorId, setForgotOperatorId] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPasscode, setNewPasscode] = useState('');

  const handleMockSubmit = (e) => {
    e.preventDefault();
    const opId = operatorId.trim().toLowerCase();
    const pass = passcode;

    if (!opId || !pass) {
      setLogs((prev) => [...prev, '[ERR] OPERATOR ID AND PASSCODE REQUIRED']);
      return;
    }

    setSubmitting(true);
    setLogs((prev) => [...prev, `[CMD] CONNECTING TO SECTOR: ${opId.toUpperCase()}`]);

    setTimeout(() => {
      // Fetch user database
      const users = JSON.parse(localStorage.getItem('emosense_users') || '[]');
      const user = users.find(u => u.operatorId === opId);

      if (!user) {
        setLogs((prev) => [
          ...prev, 
          `[ERR] OPERATOR NODE "${opId.toUpperCase()}" NOT FOUND. ACCESS REJECTED.`
        ]);
        setSubmitting(false);
        return;
      }

      if (user.passcode !== pass) {
        setLogs((prev) => [
          ...prev, 
          `[ERR] INVALID PASSCODE KEY FOR OPERATOR "${opId.toUpperCase()}". ACCESS DENIED.`
        ]);
        setSubmitting(false);
        return;
      }

      setLogs((prev) => [...prev, '[SYS] PASSWORD VERIFIED. SECURITY HANDSHAKE COMPLETED']);
      
      setTimeout(() => {
        setLogs((prev) => [...prev, '[SYS] SESSION TOKEN GENERATED. REDIRECTING...']);
        setTimeout(() => {
          localStorage.setItem('emosense_session', opId);
          router.push('/dashboard');
        }, 800);
      }, 500);
    }, 800);
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    const opId = forgotOperatorId.trim().toLowerCase();
    if (!opId) return;

    // Fetch user database
    const users = JSON.parse(localStorage.getItem('emosense_users') || '[]');
    const user = users.find(u => u.operatorId === opId);

    if (!user) {
      setLogs((prev) => [
        ...prev,
        `[ERR] CANNOT GENERATE OTP. OPERATOR "${opId.toUpperCase()}" DOES NOT EXIST.`
      ]);
      return;
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);

    const contactTarget = otpMethod === 'email' ? user.email : user.phone;
    setLogs((prev) => [
      ...prev,
      `[CMD] TRIGGERING RESET PROTOCOL FOR ${opId.toUpperCase()}`,
      `[SYS] SIMULATING TRANSCEIVER OUTPUT TO ${contactTarget}`,
      `[SYS] CODE DISPATCHED -> SECURE_OTP: ${otp}`
    ]);

    setForgotStep(2);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (enteredOtp === generatedOtp) {
      setLogs((prev) => [...prev, '[SYS] OTP VERIFIED SUCCESSFULLY. INPUT NEW PASSCODE CODE.']);
      setForgotStep(3);
    } else {
      setLogs((prev) => [...prev, '[ERR] VERIFICATION CODE MISMATCH. TRY AGAIN.']);
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!newPasscode.trim()) return;

    const opId = forgotOperatorId.trim().toLowerCase();
    const users = JSON.parse(localStorage.getItem('emosense_users') || '[]');
    const userIndex = users.findIndex(u => u.operatorId === opId);

    if (userIndex !== -1) {
      users[userIndex].passcode = newPasscode;
      localStorage.setItem('emosense_users', JSON.stringify(users));
      setLogs((prev) => [...prev, '[SYS] PASSCODE RECONFIGURED. DATABASE ALIGNED.', '[SYS] RETURN TO SIGN IN TO COMMENCE LOGIN.']);
      
      // Reset state and exit forgot mode
      setTimeout(() => {
        setForgotMode(false);
        setForgotStep(1);
        setOperatorId(opId);
        setPasscode('');
      }, 1500);
    }
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
        /* Custom styled offline console login */
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
              EMO_SENSE_CONSOLE
            </h2>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #94a3b8)', letterSpacing: '1px', marginTop: '4px' }}>
              {forgotMode ? 'PASSCODE RECOVERY SEQUENCE' : 'SECURE OPERATOR PORTAL // MOCK MODE'}
            </p>
          </div>

          {!forgotMode ? (
            /* Sign-in Form */
            <form onSubmit={handleMockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  OPERATOR_IDENTIFICATION_CODE
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                    ACCESS_PASSCODE
                  </label>
                  <button 
                    type="button"
                    onClick={() => setForgotMode(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.65rem', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                  >
                    // FORGOT_PASSCODE?
                  </button>
                </div>
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
                {submitting ? 'VALIDATING_CREDENTIALS...' : 'ESTABLISH_LINK'}
              </button>
            </form>
          ) : (
            /* Forgot Password / Recovery Forms */
            <div>
              {forgotStep === 1 && (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      OPERATOR_ID_TO_RECOVER
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aaditya"
                      value={forgotOperatorId}
                      onChange={(e) => setForgotOperatorId(e.target.value)}
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
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      VERIFICATION_METHOD
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <label style={{ fontSize: '0.75rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="otpMethod" 
                          checked={otpMethod === 'email'} 
                          onChange={() => setOtpMethod('email')} 
                        />
                        OTP TO EMAIL
                      </label>
                      <label style={{ fontSize: '0.75rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="otpMethod" 
                          checked={otpMethod === 'phone'} 
                          onChange={() => setOtpMethod('phone')} 
                        />
                        OTP TO PHONE
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setForgotMode(false)}
                      style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: '#fff', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem' }}
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 1, background: 'var(--accent-indigo)', border: 'none', color: '#fff', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 'bold' }}
                    >
                      SEND_OTP
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      ENTER_6_DIGIT_OTP_CODE
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123456"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      required
                      maxLength={6}
                      style={{
                        width: '100%',
                        background: '#050508',
                        border: '1px solid var(--border-cyber)',
                        padding: '10px 14px',
                        color: '#fff',
                        borderRadius: '4px',
                        outline: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        letterSpacing: '2px',
                        textAlign: 'center',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: '#fff', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem' }}
                    >
                      BACK
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 1, background: 'var(--accent-indigo)', border: 'none', color: '#fff', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 'bold' }}
                    >
                      VERIFY_OTP
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      SET_NEW_ACCESS_PASSCODE
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value)}
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
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{ width: '100%', background: 'var(--accent-indigo)', border: 'none', color: '#fff', padding: '12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', fontWeight: 'bold' }}
                  >
                    UPDATE_PASSCODE
                  </button>
                </form>
              )}
            </div>
          )}

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
              maxHeight: '110px',
              overflowY: 'auto',
              lineHeight: '1.4'
            }}
          >
            {logs.map((log, idx) => (
              <div key={idx} style={{ color: log.startsWith('[CMD]') ? 'var(--accent-cyan)' : log.startsWith('[ERR]') ? '#ff453a' : log.includes('SECURE_OTP') ? '#30d158' : '' }}>
                {log}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.7rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>First time visiting? </span>
            <Link href="/sign-up" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
              INITIALIZE_NEW_NODE &gt;
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
          <SignIn
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
