# Data in DB but not in app – troubleshooting

When the backend (scrapers) has written listings to Supabase but the frontend dashboard shows no (or wrong) data, use this checklist. It aligns with the backend repo’s guidance.

---

## 1. Same Supabase project (most common)

Backend (e.g. Railway) and frontend (Vercel / local Next.js) must use the **same** Supabase project.

| Side     | Env vars that must match the project |
|----------|--------------------------------------|
| Backend  | `SUPABASE_URL` (+ service role key)  |
| Frontend | `NEXT_PUBLIC_SUPABASE_URL` (+ `SUPABASE_SERVICE_ROLE_KEY` for server-side fetch) |

If the frontend URL points at another project (or old/staging), the app reads from a different `listings` table, so you see no data even though the backend wrote hundreds of rows.

**What the frontend does:** The dashboard loads listings in `src/app/dashboard/page.tsx` via `createServerClient()` (Supabase **service role** key). If the query fails (e.g. wrong project or invalid key), the UI now shows a **red banner** with the error and a hint to use the same Supabase project as the backend.

**Check:** Supabase Dashboard → **Settings → API** → copy **Project URL**. Confirm both Railway (backend) and frontend env (Vercel / `.env.local`) use that exact URL.

---

## 2. Frontend query has no server-side filters

The dashboard does **not** filter by `source` or date in the Supabase query. It runs:

- `.from('listings').select('*').order('created_at', { ascending: false })`

So `komornik` (and any other source) is not excluded at fetch time. Filtering by source, status, city, and price happens only **client-side** in `ListingDashboard`; if the user hasn’t selected a filter, all fetched listings are shown. If you see 0 ofert, the problem is not “hidden by source filter” but either wrong project, missing env, or a failed request (see the red banner).

---

## 3. RLS

The dashboard uses the **service role** key for the server-side listing fetch (`src/lib/supabase-server.ts`). Service role bypasses RLS, so RLS policies do not block this read. If the backend doc mentions “anon key might see 0 rows”, that applies to client-side anon usage; our dashboard load is server-side with service role. Ensure the schema has been applied (e.g. `supabase-schema.sql` with “Allow all on listings” if you ever use anon for listings elsewhere).

---

## 4. Missing env in the frontend

If `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing where the Next app runs (e.g. Vercel), the dashboard shows a **red banner**:

- *"Brak konfiguracji Supabase (NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY). Sprawdź .env.local i zmienne w Vercel."*

Fix by setting both variables for the same Supabase project and redeploying / restarting.

---

## Quick verification (aligned with backend)

1. In the **same** Supabase project where the backend writes, open **SQL Editor** and run:
   ```sql
   SELECT COUNT(*), source FROM listings GROUP BY source;
   ```
   You should see `komornik` (and others) with expected counts.

2. In this repo, confirm `NEXT_PUBLIC_SUPABASE_URL` (and `SUPABASE_SERVICE_ROLE_KEY`) point at that project’s URL and key.

3. Load the dashboard. If the request fails, the **red banner** will show the Supabase error (e.g. invalid key, wrong project). If there is no banner and you still see 0 ofert, the frontend is reading from Supabase but getting 0 rows → confirm you’re not looking at a different project in the Supabase dashboard.

---

## Summary

| Backend commentary point      | Frontend alignment |
|------------------------------|--------------------|
| Same Supabase Project URL    | Error banner tells user to use same project as backend; doc above repeats the check. |
| Frontend filters             | No server-side `.eq('source', …)` or date filter; only client-side filters. |
| RLS                          | Dashboard uses service role → RLS not blocking this fetch. |
| Env (URL + key)              | Missing URL or `SUPABASE_SERVICE_ROLE_KEY` triggers a clear banner in the UI. |

For a longer step-by-step in the backend repo, see **`docs/DATA_IN_DB_NOT_IN_APP.md`** there. Start by ensuring backend and frontend use the same Supabase Project URL; that fixes most “data in DB but not in app” cases.
