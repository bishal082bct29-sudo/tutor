import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Sanitize Cloudinary environment variables to prevent malformed config crashes
export function sanitizeCloudinaryEnv() {
  if (process.env.CLOUDINARY_URL) {
    let url = process.env.CLOUDINARY_URL.trim();
    if (url.startsWith('CLOUDINARY_URL=')) {
      url = url.replace(/^CLOUDINARY_URL=/, '').trim();
    }
    // Check if it's a valid cloudinary URL format without dummy placeholder brackets
    if (url.startsWith('cloudinary://') && !url.includes('<your_api_key>') && !url.includes('<')) {
      process.env.CLOUDINARY_URL = url;
    } else {
      delete process.env.CLOUDINARY_URL;
    }
  }

  // Also sanitize separate parameters if present
  ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].forEach((key) => {
    if (process.env[key]) {
      let val = process.env[key].trim();
      if (val.startsWith(`${key}=`)) {
        val = val.replace(new RegExp(`^${key}=`), '').trim();
      }
      if (val && !val.includes('<')) {
        process.env[key] = val;
      } else {
        delete process.env[key];
      }
    }
  });
}

// Sanitize immediately before any Cloudinary loading
sanitizeCloudinaryEnv();

let cloudinaryInstance = null;

export function getCloudinary() {
  sanitizeCloudinaryEnv();

  if (cloudinaryInstance) {
    return cloudinaryInstance;
  }

  try {
    const { v2: c } = require('cloudinary');
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
      c.config({ url: cloudinaryUrl });
      cloudinaryInstance = c;
      return cloudinaryInstance;
    }

    if (cloudName && apiKey && apiSecret) {
      c.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      cloudinaryInstance = c;
      return cloudinaryInstance;
    }
  } catch (err) {
    console.warn('Cloudinary config error:', err.message);
  }

  return null;
}
