# Backend: 20 links found but 0 (or almost 0) in the database

The scraper reports **20 links** on the list page, but **0 rows** (or only 1) appear in Supabase. So the problem is not “timeout after the first” but that **links are not turning into saved listings**.

---

## Likely causes

1. **Detail fetch or parse fails for (almost) all links**
   - Detail URLs might be wrong (e.g. relative vs absolute, or a different path).
   - The detail-page HTML structure may have changed, so the parser finds nothing (title, price, date, etc.) and skips or errors.
   - Add logging: for each detail URL, log “fetch ok/fail” and “parse ok/skip” so you see how many actually produce a normalized listing.

2. **Filter removes everything before upsert**
   - If **`days_back`** is set (e.g. 1), only listings with `auction_date` within the last N days are kept. If all 20 are older, you get 0 rows to upsert.
   - Check: log how many listings remain after the date filter. Try a run with **no** `days_back` (or a large value) and see if rows appear.

3. **Upsert is never called or always fails**
   - Maybe the code path that calls `upsert_listings()` is not reached (e.g. only runs when there are “new” items and the logic is wrong).
   - Or Supabase returns errors (wrong key, RLS, connection). Log the response/error from `upsert_listings()` and confirm the same Supabase URL/key are used as in the frontend.

4. **Wrong table or database**
   - Backend might be writing to a different Supabase project or table. Confirm the backend’s Supabase env vars match the project where the frontend (and your screenshot) read from.

---

## What to do in hunter-backend

1. **Log after each step**
   - After collecting list links: “Komornik: 20 links”.
   - After each detail: “detail 1/20: fetch ok, parse ok” or “fetch fail” / “parse skip”.
   - After filter: “after days_back filter: N listings”.
   - After upsert: “upsert_listings called with N rows, result: …”.

2. **Temporarily disable `days_back`**
   - Run with no `days_back` (or a large value like 365). If rows then appear in the DB, the filter was removing them.

3. **Confirm detail URLs and parsing**
   - Print or log one detail URL and open it in a browser. Check that the parser’s selectors match the current HTML (title, price, auction_date, etc.).

4. **Confirm Supabase write**
   - Log the payload (or row count) passed to `upsert_listings()` and any error it returns. Ensure you’re using the same table and project as the frontend.

---

## Summary

| Symptom | Check |
|--------|--------|
| 20 links, 0 in DB | Detail fetch/parse success rate; filter (`days_back`); upsert called and succeeding; correct Supabase table/project. |
| 20 links, 1 in DB (rest timeout) | See parallel fetches and timeouts in BACKEND_ASYNC_RUN.md if you later hit run-length limits. |

The frontend only shows what’s in Supabase; fixing why 0 (or 1) of 20 links become rows is entirely in the backend.
