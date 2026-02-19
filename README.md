# Hunter – dashboard okazji nieruchomościowych

Aplikacja frontendowa do **hunter-backend**: wyświetla oferty nieruchomości z trzech źródeł — **licytacje komornicze** (region Kielce), **e-licytacje sądowe** i **Facebook** (Apify). Lista w formie kart z filtrami (źródło, status, miasto, cena), sortowaniem po cenie, licznikiem wyników i odnośnikiem do oryginalnej oferty. Dla licytacji: countdown do terminu; dla nowych ofert: badge „NOWE (dzisiaj)”. Status oferty (new / contacted / viewed / archived) można zmieniać z poziomu dashboardu. Digest e-mail (Resend) wysyła nowe oferty do adresów z `alert_rules`. Dane w Supabase; backend (Python) zbiera oferty i obsługuje webhook Apify.

Wyrównanie schematu z backendem: [ALIGNMENT.md](./ALIGNMENT.md).

## Uruchomienie

```bash
cp .env.example .env.local
# Uzupełnij zmienne w .env.local

npm install
npm run dev
```

Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)  
*(Jeśli port 3000 jest zajęty, Next użyje 3001, 3002… – sprawdź w terminalu.)*

## Konfiguracja

- **Supabase** – utwórz projekt i uruchom `supabase-schema.sql` w SQL Editor. Uzupełnij `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Apify (Facebook)** – główna obsługa w **hunter-backend**: w Apify ustaw webhook na `https://<host-backendu>/webhook/apify`, ten sam `APIFY_WEBHOOK_SECRET` w Apify i w config/env backendu. Opcjonalnie (zapas): frontend `POST /api/apify/webhook` – wtedy uzupełnij `APIFY_TOKEN` i `APIFY_WEBHOOK_SECRET` w `.env.local`.
- **Resend** – klucz API i nadawca w `RESEND_API_KEY`, `DIGEST_FROM_EMAIL`.
- **Cron** – Vercel wywołuje `/api/cron/notify` raz dziennie (8:00 UTC). Endpoint wymaga nagłówka `Authorization: Bearer <CRON_SECRET>` i zwraca 401 bez niego. W Vercel ustaw `CRON_SECRET` w env i w Cron Job nagłówek `Authorization: Bearer <CRON_SECRET>`.
- **On-demand run (przycisk „Odśwież oferty”)** – proxy do backendu `POST /api/run`. W Vercel ustaw `BACKEND_URL` (np. `https://twoja-aplikacja.up.railway.app`) i opcjonalnie `HUNTER_RUN_SECRET` (ten sam co w backendzie; nagłówek `X-Run-Secret`). Błędy są logowane w Vercel (Functions → Logs); bez `BACKEND_URL` przycisk pokaże komunikat konfiguracyjny.

### Test cron lokalnie

```bash
curl -H "Authorization: Bearer TWOJ_CRON_SECRET" "http://localhost:3000/api/cron/notify"
```
Użyj portu, na którym faktycznie działa `npm run dev` (np. 3001, jeśli 3000 był zajęty).

## Endpointy

| Endpoint | Opis |
|----------|------|
| `GET /dashboard` | Lista ofert, filtry, statusy; przycisk „Odśwież oferty” wywołuje scrapery |
| `PATCH /api/listings/[id]` | Aktualizacja statusu (body: `{ "status": "contacted" }`) |
| `POST /api/run` | Proxy do backendu `POST /api/run` (on-demand scrape). Env: `BACKEND_URL`, opcjonalnie `HUNTER_RUN_SECRET`. |
| `POST /api/apify/webhook` | Webhook Apify (zapas) – używaj backendu; ten endpoint tylko na awarię |
| `GET /api/cron/notify` | Cron – wysyła digest (tylko `status = 'new'` i `notified = false`), ustawia `notified = true`. Wymaga `Authorization: Bearer CRON_SECRET`. |

## Decyzje MVP

Zobacz [DECISIONS.md](./DECISIONS.md).
