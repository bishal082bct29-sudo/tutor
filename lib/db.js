import { neon } from '@neondatabase/serverless';

export const sql = (...args) => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Please set DATABASE_URL environment variable.');
  }
  const client = neon(url);
  return client(...args);
};

