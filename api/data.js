import { sql } from '../lib/db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT data, updated_at FROM site_data WHERE id = 'main'`;
      if (!rows || rows.length === 0) {
        return res.status(200).json({ data: null, updatedAt: null });
      }
      return res.status(200).json({ data: rows[0].data, updatedAt: rows[0].updated_at });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Request body must be a JSON object.' });
      }
      const rows = await sql`
        INSERT INTO site_data (id, data, updated_at)
        VALUES ('main', ${JSON.stringify(body)}::jsonb, now())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
        RETURNING updated_at
      `;
      return res.status(200).json({ updatedAt: rows && rows[0] ? rows[0].updated_at : new Date().toISOString() });
    }

    res.setHeader('Allow', 'GET, PUT, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    console.error('api/data error:', err);
    return res.status(500).json({ error: 'Database error. Check DATABASE_URL and that schema.sql has been run.' });
  }
}
