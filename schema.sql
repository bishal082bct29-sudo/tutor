-- Run this once against your Neon database (e.g. via the Neon SQL editor
-- or `psql "$DATABASE_URL" -f schema.sql`).

CREATE TABLE IF NOT EXISTS site_data (
  id         TEXT PRIMARY KEY DEFAULT 'main',
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
