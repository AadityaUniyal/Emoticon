import { NextResponse } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { mockAuth, isMockAuth } from '@/lib/auth-helpers';
import { query } from '@/lib/db';

const auth = isMockAuth ? mockAuth : clerkAuth;

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { featureType, inputText, originalOutput, correctedOutput } = body;

    if (!featureType || !inputText || !originalOutput || !correctedOutput) {
      return NextResponse.json({ error: 'Missing feedback parameters' }, { status: 400 });
    }

    await query(
      `INSERT INTO telemetry_feedback (user_id, feature_type, input_text, original_output, corrected_output)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, featureType, inputText, originalOutput, correctedOutput]
    );

    console.log(`📝 Registered feedback loop adjustment: "${originalOutput}" -> "${correctedOutput}"`);
    return NextResponse.json({ success: true, message: 'Feedback telemetry updated successfully.' });
  } catch (err) {
    console.error('❌ Feedback API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
