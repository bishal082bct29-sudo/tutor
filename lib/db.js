import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_STORAGE_FILE = path.join(__dirname, '..', 'site_data_local.json');

let inMemorySiteData = null;
let inMemoryUpdatedAt = new Date().toISOString();
let isTableInitialized = false;

// Load local fallback data from file if present
try {
  if (fs.existsSync(LOCAL_STORAGE_FILE)) {
    const raw = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.data) {
      inMemorySiteData = parsed.data;
      inMemoryUpdatedAt = parsed.updated_at || new Date().toISOString();
    }
  }
} catch (e) {
  console.warn('Could not read site_data_local.json fallback:', e.message);
}

async function ensureTable(client) {
  if (isTableInitialized) return;
  try {
    await client`
      CREATE TABLE IF NOT EXISTS site_data (
        id         TEXT PRIMARY KEY DEFAULT 'main',
        data       JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    isTableInitialized = true;
  } catch (err) {
    console.warn('Could not auto-create site_data table:', err.message);
  }
}

export const sql = async (strings, ...values) => {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL;

  const isValidPostgresUrl =
    url &&
    typeof url === 'string' &&
    url.trim().length > 12 &&
    (url.startsWith('postgres://') || url.startsWith('postgresql://'));

  if (isValidPostgresUrl) {
    try {
      const client = neon(url.trim());
      if (!isTableInitialized) {
        await ensureTable(client);
      }
      return await client(strings, ...values);
    } catch (err) {
      if (err.message && err.message.includes('relation "site_data" does not exist')) {
        try {
          const client = neon(url.trim());
          isTableInitialized = false;
          await ensureTable(client);
          return await client(strings, ...values);
        } catch (retryErr) {
          console.warn('Neon DB retry failed after table creation:', retryErr.message);
        }
      }
      console.warn('Neon DB query failed, using in-memory/local file store fallback:', err.message);
    }
  }

  // Fallback persistent file / memory handler if DATABASE_URL is not set or query failed
  if (!inMemorySiteData) {
    try {
      if (fs.existsSync(LOCAL_STORAGE_FILE)) {
        const raw = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data) {
          inMemorySiteData = parsed.data;
          inMemoryUpdatedAt = parsed.updated_at || new Date().toISOString();
        }
      }
    } catch (e) {}
  }

  const rawSql = Array.isArray(strings) ? strings.join('?') : String(strings);
  if (rawSql.includes('SELECT data')) {
    if (!inMemorySiteData) {
      return [];
    }
    return [{ data: inMemorySiteData, updated_at: inMemoryUpdatedAt }];
  } else if (rawSql.includes('INSERT INTO site_data')) {
    const dataVal = values[0];
    inMemorySiteData = typeof dataVal === 'string' ? JSON.parse(dataVal) : dataVal;
    inMemoryUpdatedAt = new Date().toISOString();
    try {
      fs.writeFileSync(
        LOCAL_STORAGE_FILE,
        JSON.stringify({ data: inMemorySiteData, updated_at: inMemoryUpdatedAt }, null, 2),
        'utf8'
      );
    } catch (writeErr) {
      console.warn('Could not persist to site_data_local.json:', writeErr.message);
    }
    return [{ updated_at: inMemoryUpdatedAt }];
  }
  return [];
};



