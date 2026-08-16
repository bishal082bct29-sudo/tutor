import './lib/cloudinary.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import dataHandler from './api/data.js';
import uploadHandler from './api/upload.js';
import deleteBlobHandler from './api/delete-blob.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const adaptHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error('API Route Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }
};

app.all('/api/data', adaptHandler(dataHandler));
app.all('/api/upload', adaptHandler(uploadHandler));
app.all('/api/delete-blob', adaptHandler(deleteBlobHandler));

// Serve static files from /public directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html for root or missing routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});

export default app;

