import { neon } from '@neondatabase/serverless';

let inMemorySiteData = null;
let inMemoryUpdatedAt = new Date().toISOString();

export const sql = async (strings, ...values) => {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const client = neon(url);
      return await client(strings, ...values);
    } catch (err) {
      console.warn('Neon DB query failed, using in-memory store fallback:', err.message);
    }
  }

  // Fallback in-memory handler if DATABASE_URL is not set or query failed
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
    return [{ updated_at: inMemoryUpdatedAt }];
  }
  return [];
};

