# Hydration errors #418 / #423 – diagnostic checklist

If you still see React hydration errors after the dashboard/card fixes, the cause is likely **outside** the app code (extensions, font, runtime). Use this checklist to narrow it down.

---

## 1. Browser extension DOM mutation (very common)

Extensions can inject attributes or nodes; React then sees different HTML than the server.

**Test:** Open the app in **incognito** with **all extensions disabled**.  
If the error disappears → extension issue (Grammarly, password managers, ad blockers, React DevTools, translation, etc.).

**Check:** View **Page Source** (not DevTools Elements). Compare with the DOM after load. If extra attributes appear only after load (e.g. `data-gr-ext-installed`, `data-new-gr-c-s-check-loaded`) → extension.

---

## 2. `next/font` class mismatch (rare)

Root layout uses `localFont()` and applies variables to `<body className={...}>`. Different build/runtime can sometimes produce different class names.

**Quick test:** In `src/app/layout.tsx`, temporarily use:

```tsx
<body>
```

instead of:

```tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
```

If the error disappears → font class mismatch. Revert and consider suppressing hydration warning on `<body>` only if needed.

---

## 3. Dev-only StrictMode

If the error appears in **dev** but **not** in a production build, it may be StrictMode double-render noise.

**Test:**

```bash
npm run build
npm start
```

Open the same page. If it disappears in production → not a real hydration bug in prod.

---

## 4. Runtime / locale difference

Server and client can have different timezone/locale. Our time-based UI is gated by `useMounted()`, so this is unlikely to be the cause — but if you want to verify:

- Server: log `Intl.DateTimeFormat().resolvedOptions()` in a server component or API route.
- Client: same in browser console.

Compare `timeZone` and `locale`.

---

## 5. Diagnostic logging (temporary)

**In root layout** (to see server vs client once):

```tsx
if (typeof window !== "undefined") {
  console.log("Client render");
} else {
  console.log("Server render");
}
```

**In a client component** (e.g. ListingCard) to see render count / order:

```tsx
console.log("Rendering ListingCard", listing.id);
```

If a component renders different counts or order server vs client, the logs will show it. Remove after debugging.

---

## 6. Use the full React error in dev

Minified errors (#418 / #423) hide the real message. Run:

```bash
npm run dev
```

Reproduce the error and open the **full message** in the console. It will say something like:

- “Expected server HTML to contain a matching `<div>` in `<div>`”
- Which element mismatched and what React expected vs found

That line pinpoints the exact node. Paste it to narrow the cause.

---

## What to report

When narrowing further, note:

- Does it happen **locally only** or also in **production** (e.g. Vercel)?
- Does it happen in **incognito** (extensions off)?
- **First load** only, or also after **refresh** / client navigation?

Those three answers usually identify the remaining cause.

---

## Summary

| Likely cause              | Test / fix |
|---------------------------|------------|
| Browser extension         | Incognito, disable extensions |
| `next/font` on `<body>`   | Temporarily remove `className` on `<body>` |
| Dev-only noise            | `npm run build && npm start` |
| Runtime/locale            | Compare `Intl.DateTimeFormat().resolvedOptions()` server vs client |
| Unknown node              | Reproduce in dev, use full non-minified error message |

Dashboard, cards, Countdown, and layout have been audited; no remaining hydration risk in that tree.
