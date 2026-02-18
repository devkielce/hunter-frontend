# Wyrównanie z hunter-backend

Frontend i backend współdzielą tę samą bazę Supabase. Poniżej sprawdzenie zgodności.

## 1. Tabela `listings`

| Wymaganie / pole     | Backend                    | Frontend                         | Zgodne |
|----------------------|----------------------------|----------------------------------|--------|
| `source_url` UNIQUE  | tak                        | tak (w `supabase-schema.sql`)   | ✅     |
| `updated_at`        | trigger                    | trigger (ten sam)                | ✅     |
| `created_at`        | default `now()`            | default `now()`                  | ✅     |
| `price_pln`         | integer grosze, `None` gdy brak | integer, null = „Cena do ustalenia” | ✅ |
| `auction_date`      | Europe/Warsaw → UTC ISO    | wyświetlanie ISO, countdown     | ✅     |
| `images`            | wszystkie URL-e            | `text[]`, wyświetlanie          | ✅     |
| `city` / `location` | cała Polska, brak filtra   | opcjonalne, null OK              | ✅     |
| `status`            | —                          | `'new' \| 'contacted' \| 'viewed' \| 'archived'`, PATCH w UI | ✅ |
| `notified`          | —                          | digest cron ustawia `true`      | ✅     |
| `raw_data`          | JSONB (opcjonalnie)        | frontend nie używa (ignorowane) | ✅     |
| `price_pln`         | BIGINT                     | frontend: Number (grosze)        | ✅     |

Backend nie musi ustawiać `status` ani `notified` – są używane tylko po stronie frontendu.

## 2. Źródła (`source`)

Backend zapisuje: **komornik**, **e_licytacje** / **elicytacje**, **olx**, **otodom**, **gratka**.  
Frontend dodatkowo: **facebook** (webhook Apify).

W `SOURCE_CONFIG` są wszystkie powyższe (w tym alias `elicytacje` → e-Licytacje).

## 3. Tabela `scrape_runs`

Należy tylko do backendu. Frontend jej nie tworzy ani nie używa. W shared Supabase backend uruchamia swój `supabase_schema.sql` (listings + scrape_runs) albo oba projekty łączą schematy – frontend nie definiuje `scrape_runs`.

## 4. Jedna baza – kolejność migracji

- **Opcja A:** Jeden wspólny plik SQL (np. w backendzie) tworzy `listings` + `scrape_runs` + `alert_rules`; frontend zakłada, że tabela już istnieje.
- **Opcja B:** Najpierw frontend: `supabase-schema.sql` (listings + alert_rules + trigger). Potem backend: tylko `scrape_runs` (i ewentualnie brakujące indeksy).

Obie opcje są poprawne przy tych samych definicjach kolumn `listings`.

## 5. Upsert po stronie backendu

Przy `source_url UNIQUE` backend powinien robić upsert po `source_url` (np. `ON CONFLICT (source_url) DO UPDATE`), żeby te same oferty nie dublowały się. Frontend w webhooku Apify robi select po `source_url` + `source` i potem update lub insert.
