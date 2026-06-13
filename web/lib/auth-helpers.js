import React from 'react';
import { useUser as clerkUseUser, UserButton as ClerkUserButton } from '@clerk/nextjs';

// Determine if we should bypass Clerk and use simulated offline mode
export const isMockAuth = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
                          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('REPLACE_ME') ||
                          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('ZW1vc2Vuc2UtdGVzdC');

// --- Mock Components ---
export const MockClerkProvider = ({ children }) => {
  return <>{children}</>;
};

export const mockUseUser = () => {
  if (typeof window === 'undefined') {
    return {
      isSignedIn: true,
      isLoaded: true,
      user: {
        firstName: 'TELEMETRY',
        lastName: 'OPERATOR',
      }
    };
  }
  
  const session = localStorage.getItem('emosense_session');
  if (!session) {
    return {
      isSignedIn: false,
      isLoaded: true,
      user: null
    };
  }

  return {
    isSignedIn: true,
    isLoaded: true,
    user: {
      firstName: session.toUpperCase(),
      lastName: 'OPERATOR',
    }
  };
};

export const MockUserButton = () => {
  return (
    <div style={{
      width: '32px',
      height: '32px',
      borderRadius: '4px',
      background: 'rgba(88, 86, 214, 0.2)',
      border: '1px solid var(--border-cyber)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      color: 'var(--accent-cyan)'
    }}>
      TO
    </div>
  );
};

// Server-side mock auth helper
export const mockAuth = () => {
  return {
    userId: 'mock_telemetry_operator_node_101',
  };
};

// Statically bound exports that adapt dynamically based on config
export const useUser = isMockAuth ? mockUseUser : clerkUseUser;
export const UserButton = isMockAuth ? MockUserButton : ClerkUserButton;
