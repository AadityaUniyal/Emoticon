import { ClerkProvider } from '@clerk/nextjs';
import { MockClerkProvider, isMockAuth } from '@/lib/auth-helpers';
import './globals.css';

export const metadata = {
  title: 'EmoSense — Antigravity Emotion Intelligence Console',
  description:
    'Deep emotion telemetry engine analyzing text into 27 cognitive states. Powered by GoEmotions, DistilBERT, and advanced NLP.',
  keywords: 'emotion detection, sentiment analysis, NLP, text classification, GoEmotions, Antigravity, AI',
  openGraph: {
    title: 'EmoSense — Antigravity Emotion Intelligence Console',
    description: 'Detect 27 fine-grained emotions in any text using state-of-the-art NLP.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  // If Clerk publishable key is invalid or placeholder, wrap in MockClerkProvider to bypass API crashes
  const Provider = isMockAuth ? MockClerkProvider : ClerkProvider;

  return (
    <Provider
      {...(isMockAuth ? {} : {
        appearance: {
          variables: {
            colorPrimary: '#5856d6',
            colorBackground: '#08080c',
            colorInputBackground: '#0d0d14',
            colorText: '#f8fafc',
            borderRadius: '6px',
          },
        }
      })}
    >
      <html lang="en">
        <body>
          {/* Antigravity Visual Layer */}
          <div className="scifi-grid" />
          <div className="scanlines" />
          {children}
        </body>
      </html>
    </Provider>
  );
}
