import { NextResponse } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { mockAuth, isMockAuth } from '@/lib/auth-helpers';
import { query } from '@/lib/db';

const auth = isMockAuth ? mockAuth : clerkAuth;

/* ───────────────────────────────────────────
   GET /api/history
   Returns prediction history for the current user.
   ─────────────────────────────────────────── */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await query(
      `SELECT id, text, emotion, confidence, top_emotions, created_at
       FROM prediction_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    const history = result.rows.map((row) => ({
      id: row.id,
      text: row.text,
      emotion: row.emotion,
      confidence: row.confidence,
      topEmotions: row.top_emotions,
      createdAt: row.created_at,
    }));

    return NextResponse.json(history);
  } catch (error) {
    console.error('❌ History error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
