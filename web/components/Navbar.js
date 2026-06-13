'use client';

import Link from 'next/link';
import { useUser } from '@/lib/auth-helpers';
import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { isSignedIn } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🧠</span>
          <span className={styles.logoText}>EMO_SENSE</span>
          <div className="status-dot" style={{ marginLeft: '4px' }} />
        </Link>

        {/* Desktop Links */}
        <div className={styles.links}>
          <a href="#features" className={styles.link}>
            <span className={styles.bracket}>[</span> Features <span className={styles.bracket}>]</span>
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            <span className={styles.bracket}>[</span> GitHub <span className={styles.bracket}>]</span>
          </a>
        </div>

        {/* Auth Buttons */}
        <div className={styles.actions}>
          {!isSignedIn ? (
            <>
              <Link href="/sign-in" className={styles.signInBtn}>
                LOG_IN
              </Link>
              <Link href="/sign-up" className={styles.ctaBtn}>
                INITIALIZE_SESSION
                <span className="corner-brackets" />
              </Link>
            </>
          ) : (
            <Link href="/dashboard" className={styles.ctaBtn}>
              LAUNCH_CONSOLE
              <span className="corner-brackets" />
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className={styles.mobileToggle}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          <span className={`${styles.hamburger} ${mobileOpen ? styles.open : ''}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <a href="#features" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
            // Features
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mobileLink}
          >
            // GitHub
          </a>
          {!isSignedIn ? (
            <>
              <Link href="/sign-in" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                LOG_IN
              </Link>
              <Link href="/sign-up" className={styles.mobileCta} onClick={() => setMobileOpen(false)}>
                INITIALIZE_SESSION
              </Link>
            </>
          ) : (
            <Link href="/dashboard" className={styles.mobileCta} onClick={() => setMobileOpen(false)}>
              LAUNCH_CONSOLE
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
