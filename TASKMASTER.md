# Hunter – Taskmaster

Single source of truth: app description, tech stack, done work, roadmap, dependencies, and docs.

---

## 1. App description

**Hunter** is a frontend dashboard for **hunter-backend**. It displays real-estate listings from three sources:

- **Licytacje komornicze** (bailiff auctions, region Kielce)
- **E-licytacje sądowe** (court e-auctions)
- **Facebook** (via Apify)

The app shows listings as **cards** with filters (source, status, city, price), sort by price, result count, and link to the original offer. For auctions it shows a **countdown** to the auction date; for offers created today it shows a **“NOWE (dzisiaj)”** badge. Users can change listing **status** (new / contacted / viewed / archived) from the dashboard. A daily **e-mail digest** (Resend) sends new offers to addresses in `alert_rules`. Data lives in **Supabase**; the backend (Python) scrapes and fills `listings` and handles the Apify webhook.

**Production:** Dashboard at `https://hunter.willonski.com/dashboard` (or your Vercel URL). Apify webhook URL: `https://hunter.willonski.com/webhook/apify` (or backend URL if using hunter-backend for webhook).

---

## 2. Tech stack & structure

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 15** (App Router) |
| React | **React 19** |
| Language | **TypeScript** |
| Styling | **Tailwind CSS** |
| Lint | **ESLint 9** (flat config via `eslint.config.mjs`, `next/core-web-vitals` via FlatCompat) |
| Data | **Supabase** (service role for server-side listing fetch) |
| E-mail | **Resend** (digest) |
| Hosting | **Vercel** (cron for digest; optional serverless for Apify webhook fallback) |

**Key routes**

| Route | Description |
|-------|-------------|
| `GET /` | Home; link to dashboard |
| `GET /dashboard` | Main dashboard: listings, filters, statuses, “Odśwież oferty” button |
| `PATCH /api/listings/[id]` | Update listing status (body: `{ "status": "contacted" }`) |
| `POST /api/run` | Proxy to hunter-backend `POST /api/run` (on-demand scrape) |
| `POST /api/apify/webhook` | Apify webhook **fallback** (main handling in hunter-backend) |
| `GET /api/cron/notify` | Daily digest cron (8:00 UTC); sets `notified = true` |

**Main app structure**

- `src/app/layout.tsx` – Root layout: `<html className="hydrated">`, `<body cz-shortcut-listen="true">` (hydration/extension workarounds), Geist fonts.
- `src/app/dashboard/page.tsx` – Server component: `getListings()` (4 sources, merge, sort, normalize), `getPriceRange()`, passes data to `ListingDashboard`.
- `src/components/ListingDashboard.tsx` – Client: filters, `filteredAndSorted`, cards grid, status PATCH.
- `src/components/ListingCard.tsx` – Client: card UI, countdown, “NOWE (dzisiaj)”, `suppressHydrationWarning` on time-dependent blocks.
- `src/components/RefreshScrapersButtonDynamic.tsx` – Client wrapper for `next/dynamic` (ssr: false) so the dashboard stays a Server Component.

---

## 3. ✅ Zrobione (done)

- [x] **Next.js 15, React 19** – App Router, TypeScript, Tailwind.
- [x] **ESLint 9** – Flat config, `eslint-config-next` via FlatCompat; no deprecated peer deps.
- [x] **Dashboard** (`/dashboard`) – Cards, filters (source, status, city, price), sort by price, result count.
- [x] **Statusy** – new, contacted, viewed, archived; PATCH `/api/listings/[id]`.
- [x] **Countdown** – do daty licytacji (co minutę, kolor &lt; 24 h).
- [x] **Link do oferty** – `source_url` w nowej karcie.
- [x] **Badge „NOWE (dzisiaj)”** – dla `created_at` z dzisiaj.
- [x] **Webhook Apify** – zapas w frontendzie `POST /api/apify/webhook`; główna obsługa w hunter-backend `POST /webhook/apify`. Apify URL: `https://hunter.willonski.com/webhook/apify` (lub backend URL).
- [x] **Cron digest** – `GET /api/cron/notify` raz dziennie (8:00 UTC), Resend, `notified = true`.
- [x] **Schemat Supabase** – `supabase-schema.sql`: listings (source_url UNIQUE, trigger updated_at), alert_rules, scrape_runs; RLS idempotentne.
- [x] **Wyrównanie z backendem** – statusy (archived), SOURCE_CONFIG (olx, otodom, gratka, elicytacje), [ALIGNMENT.md](./ALIGNMENT.md).
- [x] **Strona główna** – link do dashboardu.
- [x] **.env.example** – wszystkie zmienne.
- [x] **Hydration** – `className="hydrated"` na `<html>`, `cz-shortcut-listen="true"` na `<body>`; `suppressHydrationWarning` w ListingCard na fragmentach zależnych od czasu.
- [x] **Next 15 compatibility** – `RefreshScrapersButton` przez Client Component (`RefreshScrapersButtonDynamic`) z `next/dynamic` (ssr: false).

---

## 4. 🔜 Opcjonalne / później

- [ ] **Realtime** – Supabase subscription przy nowych ofertach (bez odświeżania).
- [ ] **Filtrowanie po stronie serwera** – przy bardzo dużej liczbie rekordów (query params do Supabase).
- [ ] **Filtry w alert_rules** – np. miasto, źródło, max cena (digest spersonalizowany).
- [ ] **Autoryzacja** – zaostrzenie RLS, logowanie.
- [ ] **Widok tabela** – przełącznik karty/tabela na desktopie.
- [ ] **Edycja alert_rules z UI** – dodawanie/usuwanie adresów e-mail (obecnie tylko w bazie).

---

## 5. Zależności

- **hunter-backend** – scrapers wypełniają `listings`; wspólny schemat (np. `supabase-schema.sql`). Backend obsługuje `POST /webhook/apify`; opcjonalnie `POST /api/run` z body `days_back`, `max_pages_auctions` (zob. [docs/BACKEND_RUN_OPTIONS.md](./docs/BACKEND_RUN_OPTIONS.md)).
- **Supabase** – jeden projekt dla frontendu i backendu; ten sam Project URL i service role w env (zob. [docs/DATA_IN_DB_NOT_IN_APP.md](./docs/DATA_IN_DB_NOT_IN_APP.md)).
- **Vercel** – cron dla `/api/cron/notify` (schedule w `vercel.json`); env: `CRON_SECRET`, `BACKEND_URL`, `HUNTER_RUN_SECRET`, Resend, Supabase, Apify (fallback).
- **Apify** – webhook: URL np. `https://hunter.willonski.com/webhook/apify` (backend) lub `https://hunter.willonski.com/api/apify/webhook` (frontend fallback); header `x-apify-webhook-secret`.

---

## 6. Dokumentacja (docs)

| Doc | Opis |
|-----|------|
| [README.md](./README.md) | Uruchomienie, konfiguracja, endpointy. |
| [ALIGNMENT.md](./ALIGNMENT.md) | Wyrównanie schematu i źródeł z hunter-backend. |
| [docs/DATA_IN_DB_NOT_IN_APP.md](./docs/DATA_IN_DB_NOT_IN_APP.md) | Gdy backend zapisuje, a frontend nie pokazuje danych (Supabase project, RLS, env). |
| [docs/BACKEND_RUN_OPTIONS.md](./docs/BACKEND_RUN_OPTIONS.md) | Body `POST /api/run`: `days_back`, `max_pages_auctions`. |
| [docs/BACKEND_ASYNC_RUN.md](./docs/BACKEND_ASYNC_RUN.md) | Asynchroniczny run (jeśli backend wspiera). |
| [docs/BACKEND_SCRAPER_TIMEOUT.md](./docs/BACKEND_SCRAPER_TIMEOUT.md) | Timeout scrapers. |
| [docs/HYDRATION_DEBUG.md](./docs/HYDRATION_DEBUG.md) | Diagnostyka błędów hydracji (rozszerzenia, font, runtime). |
| [docs/FRONTEND_HYDRATION_CHECKLIST.md](./docs/FRONTEND_HYDRATION_CHECKLIST.md) | Checklist hydracji. |
| [docs/FRONTEND_RENDER_SNIPPET.md](./docs/FRONTEND_RENDER_SNIPPET.md) | Snippety renderu. |

---

## 7. Deployment & env (skrót)

- **Vercel** – `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DIGEST_FROM_EMAIL`, `CRON_SECRET`, `BACKEND_URL`, opcjonalnie `HUNTER_RUN_SECRET`, `APIFY_TOKEN`, `APIFY_WEBHOOK_SECRET` (dla fallback webhook).
- **Cron** – wywołanie `GET /api/cron/notify` z nagłówkiem `Authorization: Bearer <CRON_SECRET>`.
- **Apify** – ustawienie URL (np. `https://hunter.willonski.com/webhook/apify`) i header `x-apify-webhook-secret` zgodnie z konfiguracją projektu.

---

*Ostatnia aktualizacja taskmastera: po przywróceniu dashboardu, Next 15, React 19, ESLint 9, poprawkach hydracji i konfiguracji Apify.*
