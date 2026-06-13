import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { 
  classifyEmotion, 
  classifySentiment, 
  classifyToxicity, 
  classifySummarization, 
  classifyNER,
  redactPII,
  classifyAspectEmotion,
  classifyKeyphrase,
  classifyCognitiveBias
} from '@/lib/classifiers';

const csvPath = path.join(process.cwd(), 'predictions.csv');

// Helper to escape CSV values
const escapeCsv = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = '"' + str.replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
  }
  return str;
};

// Helper to append records to CSV file
const appendToCsv = (userId, featureType, text, output, confidence) => {
  try {
    const timestamp = new Date().toISOString();
    const row = `${escapeCsv(timestamp)},${escapeCsv(userId)},${escapeCsv(featureType)},${escapeCsv(text)},${escapeCsv(output)},${escapeCsv(confidence)}\n`;
    
    if (!fs.existsSync(csvPath)) {
      const header = 'Timestamp,User_ID,Feature_Type,Input_Text,Dominant_Output,Confidence_Accuracy\n';
      fs.writeFileSync(csvPath, header);
    }
    fs.appendFileSync(csvPath, row);
  } catch (err) {
    console.error('⚠️ Failed to append to CSV:', err.message);
  }
};

// Rate limiting store (in-memory)
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;
const rateLimitStore = new Map(); // keyId -> array of timestamps

function isRateLimited(keyId) {
  const now = Date.now();
  if (!rateLimitStore.has(keyId)) {
    rateLimitStore.set(keyId, [now]);
    return false;
  }
  const timestamps = rateLimitStore.get(keyId);
  const validTimestamps = timestamps.filter(ts => now - ts < WINDOW_MS);
  if (validTimestamps.length >= MAX_REQUESTS) {
    rateLimitStore.set(keyId, validTimestamps);
    return true;
  }
  validTimestamps.push(now);
  rateLimitStore.set(keyId, validTimestamps);
  return false;
}

// Helper to log key API calls
async function logApiCall(keyId, featureType, latencyMs, statusCode, ipAddress) {
  try {
    await query(
      `INSERT INTO api_logs (key_id, feature_type, latency_ms, status_code, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [keyId, featureType, latencyMs, statusCode, ipAddress]
    );
  } catch (err) {
    console.error('⚠️ Failed to save API log to PostgreSQL:', err.message);
  }
}

export async function POST(request) {
  const start = Date.now();
  try {
    // 1. Authenticate via x-api-key header
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized: Missing x-api-key header' }, { status: 401 });
    }

    const keyCheck = await query(
      `SELECT user_id, id, key_name FROM developer_keys WHERE api_key = $1`,
      [apiKey]
    );

    if (keyCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    const keyRecord = keyCheck.rows[0];
    const { user_id: userId, id: keyId } = keyRecord;

    // Update last used timestamp asynchronously
    query(`UPDATE developer_keys SET last_used_at = NOW() WHERE id = $1`, [keyId]).catch(err => 
      console.error('Failed to update api key last_used_at:', err.message)
    );

    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';

    // 2. Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      const latency_ms = Date.now() - start;
      await logApiCall(keyId, 'unknown', latency_ms, 400, ipAddress);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { text, type = 'emotion' } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      const latency_ms = Date.now() - start;
      await logApiCall(keyId, type, latency_ms, 400, ipAddress);
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (text.length > 5000) {
      const latency_ms = Date.now() - start;
      await logApiCall(keyId, type, latency_ms, 400, ipAddress);
      return NextResponse.json({ error: 'Text must be under 5000 characters' }, { status: 400 });
    }

    // Rate Limit Check
    if (isRateLimited(keyId)) {
      const latency_ms = Date.now() - start;
      await logApiCall(keyId, type, latency_ms, 429, ipAddress);
      return NextResponse.json(
        { error: 'Too Many Requests: Rate limit of 60 requests per minute exceeded.' },
        { status: 429 }
      );
    }

    // 3. PII Redaction pre-processing filter
    const sanitizedText = redactPII(text.trim());

    // 4. Classify based on type using the redacted text
    let result;
    switch (type) {
      case 'sentiment':
        result = classifySentiment(sanitizedText);
        break;
      case 'toxicity':
        result = classifyToxicity(sanitizedText);
        break;
      case 'summarization':
        result = classifySummarization(sanitizedText);
        break;
      case 'ner':
        result = classifyNER(sanitizedText);
        break;
      case 'aspect_emotion':
        result = classifyAspectEmotion(sanitizedText);
        break;
      case 'keyphrase':
        result = classifyKeyphrase(sanitizedText);
        break;
      case 'cognitive_bias':
        result = classifyCognitiveBias(sanitizedText);
        break;
      case 'emotion':
      default:
        result = classifyEmotion(sanitizedText);
    }

    const latency_ms = Date.now() - start;

    // --- Save prediction logs (PostgreSQL + CSV) ---
    const activeUser = `${userId} (via API Key: ${keyRecord.key_name})`;

    // CSV Appending
    appendToCsv(activeUser, type, sanitizedText, result.dominant, result.confidence);

    // PostgreSQL database logging
    try {
      await query(
        `INSERT INTO telemetry_history (user_id, feature_type, input_text, dominant_output, confidence, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, type, sanitizedText, result.dominant, result.confidence, JSON.stringify(result.metadata)]
      );
    } catch (dbError) {
      console.error('⚠️ Failed to save prediction to PostgreSQL:', dbError.message);
    }

    // Insert key audit log entry (success: 200)
    await logApiCall(keyId, type, latency_ms, 200, ipAddress);

    return NextResponse.json({
      dominant: result.dominant,
      confidence: result.confidence,
      metadata: result.metadata,
      latency_ms,
      source: 'public_api',
      type
    });

  } catch (error) {
    console.error('❌ Public API predict error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
