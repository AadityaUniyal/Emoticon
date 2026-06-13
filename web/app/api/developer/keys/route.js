import { NextResponse } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { mockAuth, isMockAuth } from '@/lib/auth-helpers';
import { query } from '@/lib/db';
import crypto from 'crypto';

const auth = isMockAuth ? mockAuth : clerkAuth;

// GET: List all keys
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await query(
      `SELECT id, key_name, api_key, created_at, last_used_at
       FROM developer_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json(res.rows);
  } catch (err) {
    console.error('❌ GET developer keys error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new key
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyName = 'Default Console Key' } = body;

    // Generate random secure token
    const token = 'sk_live_' + crypto.randomBytes(24).toString('hex');

    const res = await query(
      `INSERT INTO developer_keys (user_id, key_name, api_key)
       VALUES ($1, $2, $3)
       RETURNING id, key_name, api_key, created_at`,
      [userId, keyName, token]
    );

    return NextResponse.json(res.rows[0]);
  } catch (err) {
    console.error('❌ POST developer key error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Revoke a key
export async function DELETE(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    await query(
      `DELETE FROM developer_keys
       WHERE id = $1 AND user_id = $2`,
      [keyId, userId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ DELETE developer key error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
