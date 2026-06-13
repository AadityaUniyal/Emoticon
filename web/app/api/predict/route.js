import { NextResponse } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { mockAuth, isMockAuth } from '@/lib/auth-helpers';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const auth = isMockAuth ? mockAuth : clerkAuth;

// CSV Path in web root
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
    console.log('📝 Saved prediction telemetry to CSV');
  } catch (err) {
    console.error('⚠️ Failed to append to CSV:', err.message);
  }
};

import { 
  EMOJI_MAP, 
  classifyEmotion, 
  classifySentiment, 
  classifyToxicity, 
  classifySummarization, 
  classifyNER,
  classifyAspectEmotion,
  classifyKeyphrase,
  classifyCognitiveBias
} from '@/lib/classifiers';


/* ───────────────────────────────────────────
   MAIN POST HANDLER
   ─────────────────────────────────────────── */
export async function POST(request) {
  const start = Date.now();

  try {
    const body = await request.json();
    const { text, type = 'emotion' } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: 'Text must be under 5000 characters' }, { status: 400 });
    }

    let result;
    let source = 'mock';

    // 1. If type is emotion and we have a backend URL, try calling FastAPI
    if (type === 'emotion') {
      try {
        const mlUrl = process.env.ML_API_URL || 'http://localhost:8000';
        const mlRes = await fetch(`${mlUrl}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim() }),
          signal: AbortSignal.timeout(6000), // fast timeout
        });

        if (mlRes.ok) {
          const mlData = await mlRes.json();
          source = 'ml';
          result = {
            dominant: mlData.emotion || mlData.label,
            confidence: mlData.confidence || mlData.score,
            metadata: {
              top3: (mlData.top3 || []).map(item => ({
                label: item.label,
                score: item.score || item.confidence,
                emoji: EMOJI_MAP[item.label] || '❓',
              }))
            }
          };
        } else {
          throw new Error('API status not ok');
        }
      } catch (mlError) {
        // Fallback to local mock
        result = classifyEmotion(text.trim());
      }
    } else {
      // 2. Classify based on secondary types
      switch (type) {
        case 'sentiment':
          result = classifySentiment(text.trim());
          break;
        case 'toxicity':
          result = classifyToxicity(text.trim());
          break;
        case 'summarization':
          result = classifySummarization(text.trim());
          break;
        case 'ner':
          result = classifyNER(text.trim());
          break;
        case 'aspect_emotion':
          result = classifyAspectEmotion(text.trim());
          break;
        case 'keyphrase':
          result = classifyKeyphrase(text.trim());
          break;
        case 'cognitive_bias':
          result = classifyCognitiveBias(text.trim());
          break;
        default:
          result = classifyEmotion(text.trim());
      }
    }

    const latency_ms = Date.now() - start;

    // --- Save prediction logs (PostgreSQL + CSV) ---
    const { userId } = await auth();
    const activeUser = userId || 'anonymous_user';

    // CSV Appending
    appendToCsv(activeUser, type, text.trim(), result.dominant, result.confidence);

    // PostgreSQL database logging
    try {
      await query(
        `INSERT INTO telemetry_history (user_id, feature_type, input_text, dominant_output, confidence, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [activeUser, type, text.trim(), result.dominant, result.confidence, JSON.stringify(result.metadata)]
      );
      console.log('🏛️ Logged prediction telemetry to PostgreSQL database');
    } catch (dbError) {
      console.error('⚠️ Failed to save prediction to PostgreSQL:', dbError.message);
    }

    return NextResponse.json({
      dominant: result.dominant,
      confidence: result.confidence,
      metadata: result.metadata,
      latency_ms,
      source,
      type
    });

  } catch (error) {
    console.error('❌ Predict API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
