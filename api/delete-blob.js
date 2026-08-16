import { getCloudinary } from '../lib/cloudinary.js';
import { del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { url, public_id } = req.body || {};
  if (!url && !public_id) {
    return res.status(400).json({ error: 'url or public_id is required.' });
  }

  // If it's a Cloudinary URL or public_id was provided
  const c = getCloudinary();
  if (c && (public_id || (url && url.includes('cloudinary.com')))) {
    try {
      let targetId = public_id;
      if (!targetId && url) {
        // Extract public ID from Cloudinary URL (e.g. /upload/v12345/folder/photo.jpg -> folder/photo)
        const parts = url.split('/upload/');
        if (parts[1]) {
          const pathWithExt = parts[1].replace(/^v\d+\//, '');
          targetId = pathWithExt.replace(/\.[^/.]+$/, '');
        }
      }

      if (targetId) {
        await c.uploader.destroy(targetId);
        return res.status(200).json({ ok: true, provider: 'cloudinary' });
      }
    } catch (err) {
      console.error('Cloudinary delete error:', err);
      return res.status(200).json({ ok: false, provider: 'cloudinary', error: err.message });
    }
  }

  // If it's a Vercel Blob URL
  if (url && url.includes('blob.vercel-storage.com')) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(200).json({ ok: true, mocked: true });
    }

    try {
      await del(url);
      return res.status(200).json({ ok: true, provider: 'vercel-blob' });
    } catch (err) {
      console.error('api/delete-blob error:', err);
      return res.status(200).json({ ok: false, error: err.message });
    }
  }

  return res.status(200).json({ ok: true });
}

