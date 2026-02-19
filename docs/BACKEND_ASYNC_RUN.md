# Backend: Run scrapers in background and return 202

So scrapers can run as long as needed without hitting Vercel or proxy timeouts, the backend can **start the run in the background** and return **202 Accepted** immediately. The frontend then shows "Run started in background" and auto-refreshes the page after 60 seconds so new listings appear.

---

## Backend behavior

### Option A: Return 202 and run in background (recommended)

1. **POST /api/run** (after validating `X-Run-Secret` and reading optional body `days_back`, `max_pages_auctions`):
   - Start the scraper run in a **background thread or task** (do not `await` it in the request handler).
   - Return **202 Accepted** immediately with a JSON body, e.g.:
     ```json
     { "message": "Run started in background. Listings will update when ready." }
     ```

2. **Background task**:
   - Run the same logic you use today (e.g. loop over sources, call `run_scraper()` with config and optional `days_back` / `max_pages_auctions`).
   - Write results to the DB (listings, `scrape_runs`) as you do now.
   - No need to notify the frontend; the frontend will refresh the dashboard after 60s and new listings will appear from Supabase.

3. **Implementation sketch (Python)**:
   - Use a thread: `threading.Thread(target=run_all_sources, args=(config, body_options), daemon=True).start()` then return 202.
   - Or, if you use async: `asyncio.create_task(run_all_sources(...))` then return 202. Ensure the task is scheduled on the same event loop and is not garbage-collected (e.g. keep a reference or use a proper task queue).

### Option B: Keep current synchronous behavior

- If the backend still returns **200** with `results` in the body, the frontend keeps current behavior: shows "Zaktualizowano: …" and refreshes immediately.
- You can support both: e.g. `?async=1` or a header to return 202 and run in background; otherwise 200 and wait. Or switch entirely to 202 + background.

---

## Frontend behavior (already implemented)

- **202** → Green message: "Run started in background. The page will refresh in 60s to show new listings." and `router.refresh()` after 60 seconds.
- **200** → Same as today: show per-source results and refresh immediately.

---

## Summary

| Backend returns | Frontend |
|-----------------|----------|
| 202 + `{ "message": "…" }` | "Run started in background", auto-refresh in 60s |
| 200 + `results`             | "Zaktualizowano: …", refresh now |

No proxy timeout for the run itself: the backend responds in 1–2 seconds with 202, and scrapers run in the background for as long as needed.
