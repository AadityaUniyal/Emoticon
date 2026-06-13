import { NextResponse } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { mockAuth, isMockAuth } from '@/lib/auth-helpers';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const auth = isMockAuth ? mockAuth : clerkAuth;
const csvPath = path.join(process.cwd(), 'predictions.csv');

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // optional filter

    // 1. Get recent logs from telemetry_history
    let logsQuery = `
      SELECT id, feature_type, input_text, dominant_output, confidence, created_at
      FROM telemetry_history
      WHERE user_id = $1
    `;
    const queryParams = [userId];

    if (type) {
      logsQuery += ` AND feature_type = $2`;
      queryParams.push(type);
    }

    logsQuery += ` ORDER BY created_at DESC LIMIT 30`;
    const logsResult = await query(logsQuery, queryParams);

    // 2. Get aggregate stats
    const statsResult = await query(
      `SELECT feature_type, COUNT(*) as count, AVG(confidence) as avg_confidence
       FROM telemetry_history
       WHERE user_id = $1
       GROUP BY feature_type`,
      [userId]
    );

    const stats = {
      total: 0,
      emotion: 0,
      sentiment: 0,
      toxicity: 0,
      summarization: 0,
      ner: 0,
      avgConfidence: 0,
    };

    let totalConfidenceSum = 0;
    statsResult.rows.forEach(row => {
      const count = parseInt(row.count, 10);
      const fType = row.feature_type;
      if (fType in stats) {
        stats[fType] = count;
      }
      stats.total += count;
      totalConfidenceSum += (row.avg_confidence || 0) * count;
    });

    stats.avgConfidence = stats.total > 0 
      ? Math.round((totalConfidenceSum / stats.total) * 100) / 100 
      : 0;

    // 3. Read last 10 lines from predictions.csv (raw lines)
    let csvLines = [];
    try {
      if (fs.existsSync(csvPath)) {
        const fileContent = fs.readFileSync(csvPath, 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
        // Skip header line at index 0 if it exists
        const dataLines = lines.slice(1);
        // Get last 10 lines
        csvLines = dataLines.slice(-10).reverse();
      }
    } catch (err) {
      console.error('Failed to read predictions.csv:', err.message);
    }

    return NextResponse.json({
      logs: logsResult.rows.map(row => ({
        id: row.id,
        featureType: row.feature_type,
        inputText: row.input_text,
        dominantOutput: row.dominant_output,
        confidence: row.confidence,
        createdAt: row.created_at,
      })),
      stats,
      csvLines,
    });
  } catch (error) {
    console.error('❌ Telemetry API error:', error);
    return NextResponse.json({ error: 'Failed to fetch telemetry data' }, { status: 500 });
  }
}
