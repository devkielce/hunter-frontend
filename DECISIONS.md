# Decyzje MVP – Hunter (dashboard okazji nieruchomościowych)

## 1. Layout dashboardu
**A) Zawsze karty** – responsywne grid (1 kolumna mobile, 2–3 na desktop). Proste i czytelne.

## 2. Filtrowanie
**Po stronie klienta** – pobieramy wszystkie listingi raz, filtrowanie w React. Przy tysiącach rekordów można później przejść na zapytania do Supabase.

## 3. Zakres cen
**Dynamiczny** – min/max z bazy (jedno query przy ładowaniu). Bez hardcodowania granic.

## 4. Countdown licytacji
- Aktualizacja **co minutę** (nie co sekundę).
- Kolor **czerwony/pilny** gdy < 24 h.
- Format: dni, godziny, minuty.

## 5. Status domyślny
**`"new"`** – kolumna w Supabase z `DEFAULT 'new'`. NULL traktujemy jako brak wartości (nie używamy).

## 6. Webhook Facebook / Supabase
- **images**: `text[]` (tablica URL-i) – Facebook może mieć wiele zdjęć lub brak.
- **notified**: `boolean`, domyślnie `false`.
- **Indeks** na `source_url` (do upsert).
- Facebook: może być tylko tekst, bez ceny → `price_pln = null`.

## 7. Email digest
Wysyłamy **wszystkie nowe** (gdzie `notified = false`) do **wszystkich adresów** z `alert_rules`. W MVP bez filtrów w alert_rules; filtry (miasto, źródło) można dodać później.

## 8. Dodatkowe funkcje (tak)
- **Klikalny link** do `source_url` (nowa karta).
- **Sortowanie** po cenie (opcja w UI).
- **Licznik wyników** (np. "Pokazano 12 z 45").
- **Badge "NOWE (dzisiaj)"** dla listingów z dzisiejszą datą `created_at`.

## 9. Realtime
**Nie w MVP** – wystarczy odświeżenie strony. Supabase Realtime można dodać w kolejnej iteracji.
