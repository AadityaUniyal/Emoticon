'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, UserButton } from '@/lib/auth-helpers';
import styles from './Sidebar.module.css';

const MENU_ITEMS = [
  { path: '/dashboard', label: 'SYS_TELEMETRY', icon: '🖥️' },
  { path: '/dashboard/emotion', label: 'EMO_DIAGNOSTICS', icon: '🧠' },
  { path: '/dashboard/sentiment', label: 'POLARITY_CONSOLE', icon: '⚖️' },
  { path: '/dashboard/toxicity', label: 'MODERATION_SCAN', icon: '🛡️' },
  { path: '/dashboard/summarization', label: 'TEXT_COMPACTOR', icon: '📝' },
  { path: '/dashboard/ner', label: 'ENTITY_EXTRACTOR', icon: '🔍' },
  { path: '/dashboard/aspect', label: 'ASPECT_EMOTION', icon: '🏷️' },
  { path: '/dashboard/keyphrase', label: 'KEYPHRASE_LAB', icon: '📌' },
  { path: '/dashboard/bias', label: 'COGNITIVE_BIAS', icon: '🎯' },
  { path: '/dashboard/batch', label: 'BATCH_PROCESSING', icon: '📂' },
  { path: '/dashboard/developer', label: 'DEVELOPER_PORTAL', icon: '🔑' },
  { path: '/dashboard/tuning', label: 'MODEL_TUNING', icon: '⚙️' },
  { path: '/dashboard/terminal', label: 'CONSOLE_SHELL', icon: '📟' },
  { path: '/dashboard/audio', label: 'VOCAL_TELEMETRY', icon: '🎙️' },
];


export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className={styles.sidebar}>
      {/* Brand Header */}
      <div className={styles.brand}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🧠</span>
          <span className={styles.logoText}>EMO_SENSE</span>
          <div className={styles.statusDot} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navHeader}>// ANALYSES_PIPELINE</div>
        <ul className={styles.menuList}>
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path} className={styles.menuItem}>
                <Link
                  href={item.path}
                  className={`${styles.menuLink} ${isActive ? styles.active : ''}`}
                >
                  <span className={styles.linkIcon}>{item.icon}</span>
                  <span className={styles.linkLabel}>{item.label}</span>
                  {isActive && <span className={styles.activeIndicator}>&lt;</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* System Status Display */}
      <div className={styles.sysStatus}>
        <div className={styles.statusRow}>
          <span>NODE:</span>
          <span className={styles.statusValue}>ACTIVE_01</span>
        </div>
        <div className={styles.statusRow}>
          <span>DB:</span>
          <span className={`${styles.statusValue} ${styles.green}`}>CONNECTED</span>
        </div>
        <div className={styles.statusRow}>
          <span>ML_SERVICE:</span>
          <span className={`${styles.statusValue} ${styles.cyan}`}>READY</span>
        </div>
      </div>

      {/* User Session Info */}
      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={styles.avatarWrap}>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: { width: 32, height: 32, borderRadius: '4px', border: '1px solid var(--border-cyber)' },
                },
              }}
            />
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>
              {user?.firstName?.toUpperCase() || 'OPERATOR'}
            </div>
            <div className={styles.userRole}>SYSTEM_OPERATOR</div>
          </div>
        </div>
        <Link 
          href="/" 
          className={styles.backHome}
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('emosense_session');
            }
          }}
        >
          // LOGOUT_SHELL
        </Link>
      </div>
    </aside>
  );
}
