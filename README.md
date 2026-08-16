# Gurukul Home Tuitions — Vercel + Neon Postgres + Cloudinary

This application is powered by:

- **Neon** (serverless Postgres) — stores all dynamic website data (profile, groups, vacancies, teacher applications, parent submissions, extra info) in the `site_data` JSONB table with automatic table creation if not already created.
- **Cloudinary** — hosts and optimizes all image and media uploads (site logo, gallery photos, teacher CVs, and commission payment screenshots).
- **Vercel Serverless Functions** (`/api/*`) — securely proxies all database queries and media uploads server-side without exposing credentials to the client.
- **Near-Live Synchronization** — polls `/api/data` periodically so updates made by the admin or applicants are synchronized across open sessions.

---

## 🚀 Environment Variables (Vercel & Local)

In **Vercel Dashboard → Project → Settings → Environment Variables**, configure:

### 1. Neon Postgres Database
- `DATABASE_URL` — your Neon connection string (e.g. `postgresql://user:password@ep-xyz.neon.tech/dbname?sslmode=require`)

### 2. Cloudinary Media Storage
**Option A (Recommended):**
- `CLOUDINARY_URL` — your full Cloudinary connection URL (e.g. `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`)

**Option B (Separate Keys):**
- `CLOUDINARY_CLOUD_NAME` — your Cloudinary cloud name
- `CLOUDINARY_API_KEY` — your Cloudinary API key
- `CLOUDINARY_API_SECRET` — your Cloudinary API secret

---

## 🛠️ Database Schema

The database table `site_data` is automatically initialized on the first request. You can also run `schema.sql` manually in the **Neon SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS site_data (
  id         TEXT PRIMARY KEY DEFAULT 'main',
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 💻 Local Development

```bash
npm install
npm run dev
```

The dev server will run on `http://localhost:3000`.

---

## 🔐 Admin Panel

- Log in via the footer admin link or top navigation.
- Check live status indicators for **Neon Database** and **Cloudinary**.
- Manage company profile, tuition groups, vacancies, teacher applicant verifications, WhatsApp statement generations, and photo gallery.
