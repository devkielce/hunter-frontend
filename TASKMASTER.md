# Hunter – Taskmaster

Stan zadań i roadmapa (frontend + współpraca z backendem).

---

## ✅ Zrobione

- [x] **Next.js 14** – App Router, TypeScript, Tailwind
- [x] **Dashboard** (`/dashboard`) – karty ofert, filtry (źródło, status, miasto, cena), sortowanie po cenie, licznik wyników
- [x] **Statusy** – new, contacted, viewed, archived; PATCH `/api/listings/[id]`
- [x] **Countdown** – do daty licytacji (co minutę, kolor &lt; 24 h)
- [x] **Link do oferty** – `source_url` w nowej karcie
- [x] **Badge „NOWE (dzisiaj)”** – dla `created_at` z dzisiaj
- [x] **Webhook Apify** – zapas w frontendzie; główna obsługa w hunter-backend `POST /webhook/apify`
- [x] **Cron digest** – `GET /api/cron/notify` raz dziennie (8:00 UTC), Resend, `notified = true`
- [x] **Schemat Supabase** – `supabase-schema.sql`: listings (source_url UNIQUE, trigger updated_at), alert_rules, scrape_runs; RLS z DROP POLICY IF EXISTS (idempotentne)
- [x] **Wyrównanie z backendem** – statusy (archived zamiast rejected/won), SOURCE_CONFIG (olx, otodom, gratka, elicytacje), [ALIGNMENT.md](./ALIGNMENT.md)
- [x] **Strona główna** – link do dashboardu
- [x] **.env.example** – wszystkie zmienne

---

## 🔜 Opcjonalne / później

- [ ] **Realtime** – Supabase subscription przy nowych ofertach (bez odświeżania)
- [ ] **Filtrowanie po stronie serwera** – przy bardzo dużej liczbie rekordów (query params do Supabase)
- [ ] **Filtry w alert_rules** – np. miasto, źródło, max cena (digest spersonalizowany)
- [ ] **Autoryzacja** – zaostrzenie RLS, logowanie
- [ ] **Widok tabela** – przełącznik karty/tabela na desktopie (obecnie tylko karty)
- [ ] **Edycja alert_rules z UI** – dodawanie/usuwanie adresów e-mail (obecnie tylko w bazie)

---

## Zależności

- **hunter-backend** – scrapers wypełniają `listings`; wspólny schemat w `supabase-schema.sql`.
- **Supabase** – jeden projekt dla frontendu i backendu.
- **Vercel** – cron dla `/api/cron/notify` (schedule w `vercel.json`).
