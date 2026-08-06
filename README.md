# Gurukul Home Tuitions — Vercel + Neon + Blob

This replaces the old Firebase (Firestore + Storage) backend with:

- **Neon** (serverless Postgres) — holds all site data as a single JSONB row,
  the same shape the old Firestore document used.
- **Vercel Functions** (`/api/*`) — the browser never talks to Neon directly;
  these serverless routes sit in between.
- **Vercel Blob** — stores uploaded CVs and payment screenshots.
- **Polling instead of push** — Postgres has no equivalent of Firestore's
  `onSnapshot`. The page polls `/api/data` every 4 seconds so other open
  tabs/devices still catch up to changes within a few seconds.

## One-time setup

1. **Create the Neon database**
   - Sign up at [neon.tech](https://neon.tech), create a project, copy the
     connection string (it looks like
     `postgresql://user:pass@ep-xxxx.neon.tech/dbname?sslmode=require`).
   - Run `schema.sql` against it — easiest via the Neon SQL Editor in their
     dashboard (paste the file contents and run), or locally:
     ```
     psql "$DATABASE_URL" -f schema.sql
     ```

2. **Push this project to a Git repo, then import it into Vercel**
   (vercel.com → Add New → Project → import your repo).

3. **Add environment variables** in Vercel → Project → Settings →
   Environment Variables:
   - `DATABASE_URL` — the Neon connection string from step 1.
   - `BLOB_READ_WRITE_TOKEN` — go to Vercel → your project → Storage →
     Create Database → **Blob**. Connecting a Blob store to the project
     sets this automatically; no need to type it in by hand.

4. **Redeploy** (Vercel → Deployments → Redeploy, or just push a commit).

That's it — visiting the deployed URL should now load and save data through
Neon, and file uploads should land in Vercel Blob.

## Local development

```
npm install
npx vercel link      # link this folder to your Vercel project
npx vercel env pull  # pulls DATABASE_URL / BLOB_READ_WRITE_TOKEN into .env.local
npx vercel dev        # runs the site + API routes locally
```

## Notes / things you may want to change later

- **Uploads are currently open to anyone** who loads the apply form —
  same as the old open Firebase Storage rules. `api/upload.js` is the place
  to add real auth/rate-limiting if you want to restrict it.
- **Gallery photos and the logo are still stored as compressed base64
  inside the JSONB row**, not in Blob — this mirrors the old Firestore
  behaviour and keeps things simple. If your gallery grows large, moving
  those to Blob too (like CVs/screenshots) would keep the database row small.
- **"Live" sync is polling, not push.** If you want instant updates instead
  of ~4-second lag, you'd need to add a pub/sub service (e.g. Pusher, Ably)
  — Neon/Postgres alone doesn't provide that on Vercel's serverless runtime.
