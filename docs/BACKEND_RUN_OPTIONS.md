# Backend: Support run options from POST /api/run body

The frontend sends an optional JSON body when the user clicks "Odśwież oferty":

- **No body / `{}`** – full run (use config as usual).
- **`{ "days_back": 1 }`** – test run: only process listings from the last 1 day (checkbox "Test run (yesterday only)").
- **`{ "days_back": 1, "max_pages_auctions": 1 }`** – same + cap to 1 page per source for a very short run.

Apply the following in **hunter-backend** so this works.

---

## 1. Read the request body in POST /api/run

In `webhook_server.py` (or wherever you handle `POST /api/run`):

- Read the request body as JSON.
- If the body is missing, empty, or invalid JSON, treat it as `{}`.
- Extract optional keys: `days_back` (number), `max_pages_auctions` (number).

Example (FastAPI-style; adjust to your framework):

```python
# In your POST /api/run handler, after auth (X-Run-Secret):

body = {}
try:
    raw = await request.body()  # or request.json() depending on framework
    if raw:
        text = raw.decode("utf-8") if isinstance(raw, bytes) else raw
        body = json.loads(text) if isinstance(text, str) else text
except Exception:
    pass

run_days_back = body.get("days_back")
run_max_pages = body.get("max_pages_auctions")
# Optional: coerce to int (JSON numbers are fine; string "1" from some clients becomes int)
if run_days_back is not None and not isinstance(run_days_back, int):
    try: run_days_back = int(run_days_back)
    except (TypeError, ValueError): run_days_back = None
if run_max_pages is not None and not isinstance(run_max_pages, int):
    try: run_max_pages = int(run_max_pages)
    except (TypeError, ValueError): run_max_pages = None
```

---

## 2. Override config for this run

Before calling the scraper run logic, compute effective values for this request:

- **days_back**: use `run_days_back` if present (integer), else `config.scraping.days_back` (or None).
- **max_pages_auctions**: use `run_max_pages` if present (integer), else `config.scraping.max_pages_auctions`.

Example:

```python
effective_days_back = run_days_back if run_days_back is not None else getattr(
    config.scraping, "days_back", None
)
effective_max_pages = run_max_pages if run_max_pages is not None else config.scraping.max_pages_auctions
```

---

## 3. Pass effective values into the run

When you call the code that runs the scrapers (e.g. `run_scraper(config, source, ...)` or a loop over sources):

- Pass **effective_days_back** and **effective_max_pages** so that this single run uses them instead of always reading from `config.scraping`.

Your scrapers already support `days_back` and `max_pages_auctions` from config; the only change is that those values can be supplied per request.

Example (conceptual):

```python
# Instead of only passing config, pass run overrides:
results = []
for source in config.scraping.sources:
    result = run_scraper(
        config,
        source,
        days_back=effective_days_back,
        max_pages_auctions=effective_max_pages,
    )
    results.append(result)
```

In `run_scraper()` (or equivalent): if `days_back` or `max_pages_auctions` are passed as arguments, use them; otherwise fall back to `config.scraping.days_back` and `config.scraping.max_pages_auctions`.

---

## 4. No response format change

Keep returning the same JSON (e.g. list of per-source results with counts and status). The frontend already handles that.

---

## Summary

| Frontend sends        | Backend should use                                  |
|-----------------------|-----------------------------------------------------|
| `{}`                  | config only                                         |
| `{ "days_back": 1 }`  | `days_back=1` for this run, rest from config        |
| `{ "max_pages_auctions": 1 }` | `max_pages_auctions=1` for this run, rest from config |

After implementing this in hunter-backend, the "Test run (yesterday only)" checkbox will shorten the run and avoid timeouts.
