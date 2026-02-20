# Frontend: snippety renderu i hydratacji

Krótkie zasady i gotowe fragmenty do wklejenia przy pracy z datami i hydratacją.

---

## Hydration: formatowanie dat

Żeby uniknąć błędów hydratacji (#418, #423), **daty muszą być albo formatowane deterministycznie (ten sam wynik na serwerze i kliencie), albo pokazywane dopiero po zamontowaniu komponentu.**

Pełna checklista i przykłady: **[FRONTEND_HYDRATION_CHECKLIST.md](./FRONTEND_HYDRATION_CHECKLIST.md)** (sekcja 4 – formatowanie dat).

---

### Szybki fix — co zrobić w kodzie

1. **Znajdź wszystkie miejsca**, gdzie renderujesz daty z listingu (`created_at`, `auction_date`):
   - wyszukaj: `toLocaleDateString`, `toLocaleString`, `new Date(`.
2. **Albo** ustaw format **deterministyczny**:
   ```js
   // zamiast toLocaleDateString() / toLocaleDateString('pl-PL')
   new Date(listing.created_at).toISOString().slice(0, 10)  // "2026-02-20"
   ```
   albo z pełnym locale i stałym `timeZone`:
   ```js
   new Date(listing.created_at).toLocaleDateString("pl-PL", {
     timeZone: "Europe/Warsaw",
     dateStyle: "medium",
   })
   ```
3. **Albo** nie formatuj daty w pierwszym renderze: pokazuj np. `"—"`, a „ładną” datę wyświetlaj **dopiero po mount** wewnątrz komponentu z `useMounted()`.

---

### Przykład „przed” i „po” (karta listingu)

**Przed** (ryzyko hydratacji — wynik zależny od środowiska):

```jsx
<span>Dodano: {new Date(listing.created_at).toLocaleString("pl-PL")}</span>
```

**Po** (opcja 1 — format deterministyczny):

```jsx
<span>
  Dodano:{" "}
  {new Date(listing.created_at).toLocaleString("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}
</span>
```

**Po** (opcja 2 — formatowanie tylko po mount):

```jsx
const mounted = useMounted();

if (!mounted) return <span>Dodano: —</span>;
return (
  <span>Dodano: {formatDate(listing.created_at)}</span>
);
```

`formatDate` może wtedy używać `toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", ... })` — wywoływane jest tylko po stronie klienta po mount, więc nie wpływa na hydratację.

---

## Zobacz też

- [FRONTEND_HYDRATION_CHECKLIST.md](./FRONTEND_HYDRATION_CHECKLIST.md) — pełna checklista (daty, `Date.now()`, `Math.random()`, placeholdery).
- [HYDRATION_DEBUG.md](./HYDRATION_DEBUG.md) — diagnostyka gdy błąd nadal występuje.
