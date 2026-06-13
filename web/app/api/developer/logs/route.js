import { NextResponse } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { mockAuth, isMockAuth } from '@/lib/auth-helpers';
import { query } from '@/lib/db';

const auth = isMockAuth ? mockAuth : clerkAuth;

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await query(
      `SELECT l.id, k.key_name, l.feature_type, l.latency_ms, l.status_code, l.ip_address, l.created_at
       FROM api_logs l
       JOIN developer_keys k ON l.key_id = k.id
       WHERE k.user_id = $1
       ORDER BY l.created_at DESC
       LIMIT 50`,
      [userId]
    );

    return NextResponse.json(res.rows.map(row => ({
      id: row.id,
      keyName: row.key_name,
      featureType: row.feature_type,
      latencyMs: row.latency_ms,
      statusCode: row.status_code,
      ipAddress: row.ip_address,
      createdAt: row.created_at
    })));
  } catch (err) {
    console.error('❌ GET API logs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
