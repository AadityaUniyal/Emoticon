'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import styles from './layout.module.css';
import { isMockAuth } from '@/lib/auth-helpers';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isMockAuth) {
      const session = localStorage.getItem('emosense_session');
      if (!session) {
        router.push('/sign-in');
      } else {
        setAuthorized(true);
      }
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className={styles.layoutContainer} style={{ background: '#030304', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>🔒</span>
          <p style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>VERIFYING OPERATOR ACCESS PRIVILEGES...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layoutContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
