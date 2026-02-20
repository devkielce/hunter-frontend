# Frontend: checklist hydracji (Next.js / React)

Zasady i przykłady, żeby uniknąć błędów hydratacji (#418, #423) przy renderze po stronie serwera i klienta.

---

## 1. Ogólna zasada

**Serwer i klient muszą wygenerować ten sam HTML przy pierwszym renderze.**  
Jeśli coś zależy od czasu, strefy czasowej, locale lub losowości i nie jest ustalone (np. jawny `timeZone`), wynik na serwerze (Node) i w przeglądarce może się różnić → błąd hydratacji.

---

## 2. Czego unikać w drzewie renderowanym (SSR + pierwszy paint klienta)

| Unikaj | Dlaczego |
|--------|----------|
| `new Date(...).toLocaleDateString()` bez opcji | Różny locale/timezone na serwerze i kliencie. |
| `new Date(...).toLocaleString('pl-PL')` bez `timeZone` | Serwer (np. UTC) vs przeglądarka (np. Europe/Warsaw) = inny tekst. |
| `Date.now()` / `new Date()` w treści lub jako key | Inna wartość w momencie SSR i w momencie hydratacji. |
| `Math.random()` w treści lub jako key | Różny wynik na serwerze i kliencie. |
| Surowa data z API (ISO) w UI przy pierwszym renderze | Różna serializacja lub inna kolejność danych = inny HTML. |

---

## 3. Co stosować zamiast

- **Format deterministyczny** — ten sam na serwerze i kliencie:
  - jawny **locale** i **timeZone** w `toLocaleDateString` / `toLocaleString`,  
  - albo **ISO / slice** (bez locale).
- **Albo** **nie formatować daty w pierwszym renderze**: pokazać placeholder (np. `"—"`), a „ładną” datę dopiero **po mount** (np. w komponencie z `useMounted()`).

---

## 4. Formatowanie dat — konkretne przykłady

### ❌ Źle — różny output na serwerze i kliencie

```js
// Różny wynik w Node (np. UTC) i w przeglądarce (np. Europe/Warsaw)
new Date(listing.created_at).toLocaleDateString()
new Date(listing.created_at).toLocaleString("pl-PL")
```

### ✅ Dobrze — format deterministyczny (ISO, bez locale)

```js
// Zawsze ten sam string (np. "2026-02-20")
new Date(listing.created_at).toISOString().slice(0, 10)
```

### ✅ Dobrze — format z locale, ale ze stałym timeZone

```js
// Ten sam wynik na serwerze i kliencie dzięki timeZone
new Date(listing.created_at).toLocaleDateString("pl-PL", {
  timeZone: "Europe/Warsaw",
  dateStyle: "medium",
})
// lub pełna data + godzina:
new Date(listing.created_at).toLocaleString("pl-PL", {
  timeZone: "Europe/Warsaw",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})
```

### ✅ Dobrze — formatowanie tylko po mount (bez ryzyka hydratacji)

```js
// W komponencie klienckim:
const mounted = useMounted();

if (!mounted) {
  return <span>Dodano: —</span>;  // placeholder – identyczny na serwerze i kliencie
}
return (
  <span>Dodano: {formatDate(listing.created_at)}</span>  // dopiero po mount
);
```

Tu `formatDate` może używać `toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', ... })` — nie wpływa na hydratację, bo ta gałąź nie renderuje się przy SSR ani przy pierwszym paint.

---

## 5. Szybka lista kontrolna przed wdrożeniem

- [ ] Wszystkie miejsca z `toLocaleDateString` / `toLocaleString` mają **jawny `timeZone`** (np. `Europe/Warsaw`) **albo** daty są formatowane **tylko po `useMounted()`**.
- [ ] Żadne `Date.now()` ani `Math.random()` w treści komponentu ani w `key`.
- [ ] Przy pierwszym renderze (SSR + pierwszy paint) dla dat wyświetlane są **placeholdery** (np. `"—"`) **albo** format **deterministyczny** (ISO lub locale + timeZone).

---

## Zobacz też

- [HYDRATION_DEBUG.md](./HYDRATION_DEBUG.md) — diagnostyka błędów #418 / #423 (rozszerzenia, fonty, StrictMode).
- [FRONTEND_RENDER_SNIPPET.md](./FRONTEND_RENDER_SNIPPET.md) — gotowe snippety „przed” / „po” dla dat i hydratacji.
