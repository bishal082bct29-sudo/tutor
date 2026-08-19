import { getCloudinary } from '../lib/cloudinary.js';
import { handleUpload } from '@vercel/blob/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');

// Ensure public/uploads exists
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('Uploads dir init warning:', e.message);
}

export default async function handler(request, response) {
  // Allow GET to check storage provider status
  if (request.method === 'GET' || (request.body && request.body.action === 'status')) {
    const c = getCloudinary();
    const hasNeon = !!(
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.NEON_DATABASE_URL
    );
    return response.status(200).json({
      cloudinary: !!c,
      vercelBlob: !!process.env.BLOB_READ_WRITE_TOKEN,
      neonDatabase: hasNeon,
      provider: c ? 'cloudinary' : (process.env.BLOB_READ_WRITE_TOKEN ? 'vercel-blob' : 'local-uploads'),
    });
  }

  const body = request.body || {};

  // Check if this is an upload request
  if (body.file || body.image || body.dataUrl || (body.action === 'upload' && body.content)) {
    const fileData = body.file || body.image || body.dataUrl || body.content;
    const folder = body.folder || 'gurukultuition';
    const rawFilename = (body.filename || ('upload_' + Date.now())).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const isVideo = typeof fileData === 'string' && (fileData.startsWith('data:video') || fileData.includes('video/'));

    const c = getCloudinary();

    if (c) {
      try {
        const uploadResult = await c.uploader.upload(fileData, {
          folder: folder,
          resource_type: isVideo ? 'video' : 'auto',
          public_id: rawFilename,
        });

        return response.status(200).json({
          ok: true,
          provider: 'cloudinary',
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height,
        });
      } catch (err) {
        console.warn('Cloudinary upload warning, saving to local static storage:', err.message);
        // Fallthrough to local static file writer
      }
    }

    // Save to local static `/uploads` storage to avoid massive base64 strings in JSON/localStorage
    try {
      if (typeof fileData === 'string' && fileData.includes(';base64,')) {
        const match = fileData.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mime = match[1];
          const base64Data = match[2];
          let ext = 'bin';

          if (mime.includes('mp4')) ext = 'mp4';
          else if (mime.includes('webm')) ext = 'webm';
          else if (mime.includes('ogg')) ext = 'ogv';
          else if (mime.includes('quicktime') || mime.includes('mov')) ext = 'mov';
          else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
          else if (mime.includes('png')) ext = 'png';
          else if (mime.includes('webp')) ext = 'webp';
          else if (mime.includes('svg')) ext = 'svg';
          else if (mime.includes('pdf')) ext = 'pdf';

          const targetFilename = `${rawFilename}.${ext}`;
          const targetPath = path.join(uploadsDir, targetFilename);
          const buffer = Buffer.from(base64Data, 'base64');

          await fs.promises.writeFile(targetPath, buffer);

          return response.status(200).json({
            ok: true,
            provider: 'local-uploads',
            url: `/uploads/${targetFilename}`,
            filename: targetFilename,
            size: buffer.length,
          });
        }
      }

      // If already a URL or path, return as is
      return response.status(200).json({
        ok: true,
        provider: 'local-fallback',
        url: fileData,
      });
    } catch (saveErr) {
      console.error('Local static upload save error:', saveErr);
      return response.status(500).json({
        error: 'Failed to save file: ' + saveErr.message,
      });
    }
  }

  // Handle Vercel Blob client token generation (if used by client)
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return response.status(200).json({
      type: 'blob.generate-client-token',
      clientToken: 'mock_token',
    });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            'image/*',
            'video/*',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 100 * 1024 * 1024,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Blob upload completed:', blob.url);
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    console.error('api/upload error:', error);
    return response.status(400).json({ error: error.message });
  }
}
