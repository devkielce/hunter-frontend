# Hunter – Taskmaster (frontend)

Single source of truth for the **Hunter** frontend: app description, architecture, alignment with backend, APIs, deployment, and document index. Use this for onboarding and alignment with **hunter-backend**. The backend repo has its own taskmaster (schema source of truth, backend commands, Apify flow).

---

## 1. App description

**Hunter** is a production-oriented system for **Polish real estate listings**:

- **Backend (hunter-backend, separate repo):** Python scrapers and webhook server. Collects listings from **komornik** (bailiff auctions), **e_licytacje** (court auctions), and **Facebook** (via Apify). Normalizes to a single schema, upserts to **Supabase**, and exposes `/webhook/apify` (Apify) and `/api/run` + `/api/run/status` (on-demand run).
- **Frontend (this repo):** Next.js dashboard: filters (source, status, city, price), sort by price, result count; listing **status** (new / contacted / viewed / archived) via PATCH; **countdown** to auction date; **“NOWE (dzisiaj)”** badge; daily **e-mail digest** (Resend); **“Odśwież oferty”** button that proxies to backend `POST /api/run`.
- **Data:** One Supabase project. Tables: `listings` (shared), `alert_rules` (frontend: digest recipients), `scrape_runs` (backend only). **Schema source of truth** is backend’s **`supabase_schema.sql`**; this repo keeps **`supabase-schema.sql`** for reference — run the backend schema once in Supabase SQL editor.

**Active sources:** komornik, e_licytacje, Facebook (Apify). OLX, Otodom, Gratka are disabled in backend config but frontend SOURCE_CONFIG includes them for display.

**Production:** Dashboard at `https://hunter.willonski.com/dashboard` (or your Vercel URL). Apify webhook is called by Apify to the **backend** at `https://hunter.willonski.com/webhook/apify` (or your deployed backend URL).

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Apify (Facebook actor)                                                 │
│  Schedule or manual run → on success POST to backend /webhook/apify     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│  Hunter Backend (separate repo)                                         │
│  POST /webhook/apify, POST /api/run, GET /api/run/status                 │
│  hunter run-all (Komornik + e_licytacje via CLI or Railway Cron)        │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│  Supabase                                                               │
│  listings (source_url UNIQUE), alert_rules, scrape_runs                  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│  Frontend (this repo, Vercel)                                            │
│  Dashboard, filters, PATCH status, cron digest, proxy POST /api/run     │
│  (Browser never calls backend; only Vercel API routes proxy with         │
│   X-Run-Secret.)                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Apify** runs the actor on a schedule or manually; when the run finishes, Apify calls the **backend** at `/webhook/apify`. Backend fetches the dataset from Apify API and upserts to Supabase.
- **Frontend does not call the backend from the browser.** It calls Vercel API routes that proxy to the backend with `X-Run-Secret` for `POST /api/run` (and optionally `GET /api/run/status` if implemented).

---

## 3. Schema alignment

**Single source of truth:** Backend’s **`supabase_schema.sql`** (in hunter-backend repo). Run it once in the Supabase SQL editor. This repo’s **`supabase-schema.sql`** is a copy for reference; column names and types must match.

| Table        | Owner     | Notes |
|-------------|-----------|--------|
| **listings** | Shared    | Backend upserts; frontend reads (service role), PATCHes `status`, digest sets `notified`. `source_url` UNIQUE; `price_pln` in grosze; `auction_date` UTC ISO. |
| **alert_rules** | Frontend | E-mail addresses for digest (Resend). |
| **scrape_runs** | Backend  | Frontend does not use. |

Dates: use `listing.auction_date || listing.created_at` for display; normalize with `row.created_at != null ? String(row.created_at).trim() : null`; never `String(undefined)`. See backend docs **DATE_NOT_RENDERING.md** and this repo’s **docs/FRONTEND_RENDER_SNIPPET.md**, **docs/FRONTEND_HYDRATION_CHECKLIST.md**.

---

## 4. Tech stack & structure

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 15** (App Router) |
| React | **React 19** |
| Language | **TypeScript** |
| Styling | **Tailwind CSS** |
| Lint | **ESLint 9** (flat config: `eslint.config.mjs`, `next/core-web-vitals` via FlatCompat) |
| Data | **Supabase** (service role for server-side listing fetch) |
| E-mail | **Resend** (digest) |
| Hosting | **Vercel** (cron for digest; API routes proxy to backend) |

**Key routes**

| Route | Description |
|-------|-------------|
| `GET /` | Home; link to dashboard |
| `GET /dashboard` | Main dashboard: listings, filters, statuses, “Odśwież oferty” |
| `PATCH /api/listings/[id]` | Update listing status (body: `{ "status": "contacted" }`) |
| `POST /api/run` | Proxy to backend `POST /api/run` (on-demand scrape). Body optional: `{ "days_back": 1 }`, `{ "max_pages_auctions": 1 }`. Sends `X-Run-Secret`. |
| `GET /api/run/status` | **Not implemented in frontend.** Backend supports it for polling; can be added as a proxy if UI needs run status. |
| `POST /api/apify/webhook` | Apify webhook **fallback** (main handling in backend `/webhook/apify`) |
| `GET /api/cron/notify` | Daily digest cron (8:00 UTC); sets `notified = true`. Requires `Authorization: Bearer CRON_SECRET`. |

**Main app structure**

- `src/app/layout.tsx` – Root layout: `<html className="hydrated">`, `<body cz-shortcut-listen="true">` (hydration/extension workarounds), Geist fonts.
- `src/app/dashboard/page.tsx` – Server component: `getListings()` (4 sources, merge, sort, normalize), `getPriceRange()`, passes data to `ListingDashboard`.
- `src/components/ListingDashboard.tsx` – Client: filters, `filteredAndSorted`, cards grid, status PATCH.
- `src/components/ListingCard.tsx` – Client: card UI, countdown, “NOWE (dzisiaj)”, `suppressHydrationWarning` on time-dependent blocks.
- `src/components/RefreshScrapersButtonDynamic.tsx` – Client wrapper for `next/dynamic` (ssr: false).

---

## 5. Frontend alignment with backend

- **Same Supabase project.** Backend uses service role; frontend uses service role for server-side listing fetch and PATCH. Same Project URL and keys in env.
- **Facebook:** Backend owns ingestion via `/webhook/apify`. Frontend can keep `POST /api/apify/webhook` as fallback only.
- **Run refresh:** Frontend “Odśwież oferty” calls **Vercel** `POST /api/run`, which proxies to backend `POST /api/run` with header **`X-Run-Secret`**. Value on Vercel: **`HUNTER_RUN_SECRET`**; must equal backend **`APIFY_WEBHOOK_SECRET`** (or backend `run_api.secret` if set). Backend may return 202 (run in background) or 200; frontend forwards the response.
- **Vercel env:** **`BACKEND_URL`** (e.g. Railway base URL, no trailing slash), **`HUNTER_RUN_SECRET`** (same as backend webhook/run secret). See **docs/BACKEND_RUN_OPTIONS.md** for optional body `days_back`, `max_pages_auctions`.
- **Dates:** Normalize with `row.created_at != null ? String(row.created_at).trim() : null`; display `auction_date || created_at`. See backend **docs/DATE_NOT_RENDERING.md** and **docs/FRONTEND_RENDER_SNIPPET.md**.

---

## 6. Apify (Facebook) setup

- **Webhook URL:** **Backend** URL, e.g. `https://hunter.willonski.com/webhook/apify` (or your deployed backend host). Not the frontend URL.
- **Method:** POST.
- **Headers:** `x-apify-webhook-secret`: same value as backend **`APIFY_WEBHOOK_SECRET`**.
- **Body:** JSON with `datasetId` or `resource.defaultDatasetId` so backend can fetch the dataset from Apify API.
- **Who starts the run:** Apify (schedule or manual). Backend only reacts to the webhook and then fetches the dataset. See backend docs **APIFY_WEBHOOK_FLOW.md**, **APIFY_INTEGRATION_CHECKLIST.md**.

---

## 7. ✅ Zrobione (done)

- [x] **Next.js 15, React 19** – App Router, TypeScript, Tailwind.
- [x] **ESLint 9** – Flat config, `eslint-config-next` via FlatCompat.
- [x] **Dashboard** – Cards, filters (source, status, city, price), sort by price, result count.
- [x] **Statusy** – new, contacted, viewed, archived; PATCH `/api/listings/[id]`.
- [x] **Countdown** – do daty licytacji (co minutę, kolor &lt; 24 h).
- [x] **Link do oferty** – `source_url` w nowej karcie.
- [x] **Badge „NOWE (dzisiaj)”** – dla `created_at` z dzisiaj.
- [x] **Webhook Apify** – fallback `POST /api/apify/webhook`; main handling in backend `/webhook/apify`.
- [x] **Cron digest** – `GET /api/cron/notify` (8:00 UTC), Resend, `notified = true`.
- [x] **Schema** – `supabase-schema.sql` in repo (reference); backend `supabase_schema.sql` is source of truth.
- [x] **Wyrównanie z backendem** – [ALIGNMENT.md](./ALIGNMENT.md); SOURCE_CONFIG (olx, otodom, gratka, elicytacje).
- [x] **Strona główna** – link do dashboardu.
- [x] **.env.example** – wszystkie zmienne.
- [x] **Hydration** – `className="hydrated"` na `<html>`, `cz-shortcut-listen="true"` na `<body>`; `suppressHydrationWarning` w ListingCard.
- [x] **Next 15** – `RefreshScrapersButton` via Client Component (`RefreshScrapersButtonDynamic`) with `next/dynamic` (ssr: false).
- [x] **Run proxy** – `POST /api/run` forwards body and `X-Run-Secret`; 401/502/504 handling and timeout.

---

## 8. 🔜 Opcjonalne / później

- [ ] **GET /api/run/status** – Proxy to backend for polling run status in UI.
- [ ] **Realtime** – Supabase subscription przy nowych ofertach.
- [ ] **Filtrowanie po stronie serwera** – query params do Supabase przy dużej liczbie rekordów.
- [ ] **Filtry w alert_rules** – miasto, źródło, max cena (digest spersonalizowany).
- [ ] **Autoryzacja** – RLS, logowanie.
- [ ] **Widok tabela** – przełącznik karty/tabela.
- [ ] **Edycja alert_rules z UI** – dodawanie/usuwanie adresów e-mail.

---

## 9. Deployment & env

- **Vercel:**  
  **Required:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DIGEST_FROM_EMAIL`, `CRON_SECRET`, **`BACKEND_URL`** (backend base URL, e.g. Railway), **`HUNTER_RUN_SECRET`** (same as backend `APIFY_WEBHOOK_SECRET`).  
  **Optional:** `APIFY_TOKEN`, `APIFY_WEBHOOK_SECRET` (for frontend Apify webhook fallback).
- **Cron:** Call `GET /api/cron/notify` with header `Authorization: Bearer <CRON_SECRET>` (e.g. Vercel Cron).
- **Backend (e.g. Railway):** Runs `hunter webhook`; env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APIFY_WEBHOOK_SECRET`, `APIFY_TOKEN` (optional), `PORT`. Frontend proxy uses `BACKEND_URL` + `HUNTER_RUN_SECRET`.

---

## 10. Document index

| Document | Description |
|----------|-------------|
| **README.md** | Uruchomienie, konfiguracja, endpointy. |
| **ALIGNMENT.md** | Wyrównanie schematu i źródeł z hunter-backend. |
| **supabase-schema.sql** | Copy of schema for reference; run backend’s `supabase_schema.sql` in Supabase. |
| **.env.example** | All env vars. |
| **docs/DATA_IN_DB_NOT_IN_APP.md** | Data in DB but not in app (Supabase project, RLS, env). |
| **docs/BACKEND_RUN_OPTIONS.md** | Body `POST /api/run`: `days_back`, `max_pages_auctions`. |
| **docs/BACKEND_ASYNC_RUN.md** | Asynchroniczny run (jeśli backend wspiera). |
| **docs/BACKEND_SCRAPER_TIMEOUT.md** | Timeout scrapers. |
| **docs/HYDRATION_DEBUG.md** | Diagnostyka błędów hydracji (extensions, font, runtime). |
| **docs/FRONTEND_HYDRATION_CHECKLIST.md** | Hydration-safe date usage. |
| **docs/FRONTEND_RENDER_SNIPPET.md** | Type, Supabase select, normalizeListing, ListingCard (pl-PL, grosze). |

**Backend repo docs** (for alignment): FRONTEND_ALIGNMENT.md, APIFY_WEBHOOK_FLOW.md, APIFY_INTEGRATION_CHECKLIST.md, FRONTEND_API_RUN_PROXY.md, DATE_NOT_RENDERING.md, RAILWAY_CRON_FULL_SCRAPE.md.

---

## 11. Quick reference

| Item | Value |
|------|-------|
| **Backend webhook URL (Apify)** | `https://hunter.willonski.com/webhook/apify` (or your backend deployment) |
| **Run API** | Backend: POST `/api/run`, GET `/api/run/status`; header `X-Run-Secret`. Frontend proxies only POST `/api/run`. |
| **Schema source of truth** | Backend **supabase_schema.sql** |
| **Frontend env (Vercel)** | BACKEND_URL, HUNTER_RUN_SECRET (= APIFY_WEBHOOK_SECRET on backend), Supabase, Resend, CRON_SECRET |
| **Dashboard** | `/dashboard` |

---

*This taskmaster is aligned with hunter-backend’s taskmaster. Keep it updated when you change APIs, env, or deployment.*
