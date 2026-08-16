import { getCloudinary } from '../lib/cloudinary.js';
import { handleUpload } from '@vercel/blob/client';

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
      provider: c ? 'cloudinary' : (process.env.BLOB_READ_WRITE_TOKEN ? 'vercel-blob' : 'local-data-url'),
    });
  }

  const body = request.body || {};

  // Check if this is a direct upload request for Cloudinary or file processing
  if (body.file || body.image || body.dataUrl || (body.action === 'upload' && body.content)) {
    const fileData = body.file || body.image || body.dataUrl || body.content;
    const folder = body.folder || 'gurukultuition';
    const c = getCloudinary();

    if (c) {
      try {
        const uploadResult = await c.uploader.upload(fileData, {
          folder: folder,
          resource_type: 'auto',
          public_id: body.filename ? body.filename.replace(/[^a-zA-Z0-9_\-]/g, '_') : undefined,
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
        console.error('Cloudinary upload error:', err);
        return response.status(500).json({
          error: 'Cloudinary upload failed: ' + (err.message || 'Unknown error'),
          details: err,
        });
      }
    } else {
      // Cloudinary not configured in env, return fallback data URL
      return response.status(200).json({
        ok: true,
        provider: 'local-fallback',
        url: fileData,
        warning: 'CLOUDINARY_URL or credentials not set; stored as inline data.',
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
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 10 * 1024 * 1024,
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

