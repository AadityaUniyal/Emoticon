import { NextResponse } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { mockAuth, isMockAuth } from '@/lib/auth-helpers';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { 
  classifyEmotion, 
  classifySentiment, 
  classifyToxicity, 
  classifySummarization, 
  classifyNER 
} from '@/lib/classifiers';

const auth = isMockAuth ? mockAuth : clerkAuth;
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

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { texts, type = 'emotion' } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: 'texts array is required' }, { status: 400 });
    }

    if (texts.length > 100) {
      return NextResponse.json({ error: 'Maximum batch size is 100 items' }, { status: 400 });
    }

    const results = [];
    const activeUser = userId || 'anonymous_user';

    for (const text of texts) {
      if (!text || typeof text !== 'string') continue;

      let result;
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
        case 'emotion':
        default:
          result = classifyEmotion(text.trim());
      }

      // Log to CSV
      appendToCsv(activeUser, type, text.trim(), result.dominant, result.confidence);

      // Log to PostgreSQL
      try {
        await query(
          `INSERT INTO telemetry_history (user_id, feature_type, input_text, dominant_output, confidence, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [activeUser, type, text.trim(), result.dominant, result.confidence, JSON.stringify(result.metadata)]
        );
      } catch (dbError) {
        console.error('⚠️ Failed to save batch item to DB:', dbError.message);
      }

      results.push({
        text,
        dominant: result.dominant,
        confidence: result.confidence,
        metadata: result.metadata,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      type,
      results
    });

  } catch (err) {
    console.error('❌ Batch API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
