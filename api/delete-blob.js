import { del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: 'url is required.' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(200).json({ ok: false, error: 'BLOB_READ_WRITE_TOKEN is not configured.' });
  }

  try {
    await del(url);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('api/delete-blob error:', err);
    // Don't fail hard — the DB record removal is what matters most to the admin.
    return res.status(200).json({ ok: false, error: err.message });
  }
}
