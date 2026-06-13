import { Pool } from 'pg';

let pool;
let tableCreated = false;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });
  }
  return pool;
}

async function ensureTable() {
  if (tableCreated) return;

  const db = getPool();
  try {
    // Maintain old table for compatibility
    await db.query(`
      CREATE TABLE IF NOT EXISTS prediction_history (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        emotion VARCHAR(50) NOT NULL,
        confidence DOUBLE PRECISION NOT NULL,
        top_emotions JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create new multi-feature telemetry history table
    await db.query(`
      CREATE TABLE IF NOT EXISTS telemetry_history (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        feature_type VARCHAR(50) NOT NULL,
        input_text TEXT NOT NULL,
        dominant_output VARCHAR(100) NOT NULL,
        confidence DOUBLE PRECISION NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create optimized indices
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_prediction_history_user_id
      ON prediction_history (user_id, created_at DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_telemetry_history_user_id
      ON telemetry_history (user_id, feature_type, created_at DESC)
    `);

    // Create developer_keys table
    await db.query(`
      CREATE TABLE IF NOT EXISTS developer_keys (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        key_name VARCHAR(100) NOT NULL,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_used_at TIMESTAMPTZ
      )
    `);

    // Create telemetry_feedback table
    await db.query(`
      CREATE TABLE IF NOT EXISTS telemetry_feedback (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        feature_type VARCHAR(50) NOT NULL,
        input_text TEXT NOT NULL,
        original_output VARCHAR(100) NOT NULL,
        corrected_output VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create api_logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS api_logs (
        id SERIAL PRIMARY KEY,
        key_id INT NOT NULL REFERENCES developer_keys(id) ON DELETE CASCADE,
        feature_type VARCHAR(50) NOT NULL,
        latency_ms INT NOT NULL,
        status_code INT NOT NULL,
        ip_address VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_developer_keys_api_key
      ON developer_keys (api_key)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_telemetry_feedback_user_id
      ON telemetry_feedback (user_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_api_logs_key_id
      ON api_logs (key_id, created_at DESC)
    `);


    tableCreated = true;
    console.log('✅ PostgreSQL telemetry tables ready');
  } catch (err) {
    console.error('❌ Failed to create tables:', err.message);
    throw err;
  }
}

export async function query(text, params) {
  await ensureTable();
  const db = getPool();
  const result = await db.query(text, params);
  return result;
}

export default { query };
