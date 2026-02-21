# Netlify: Fix "Secrets scanning detected secrets in files during build"

If your Netlify deploy fails with:

```text
Secrets scanning detected secrets in files during build.
Build failed due to a user error: Build script returned non-zero exit code: 2
```

**Cause:** Netlify’s **smart detection** scans repo and **build output**. Next.js inlines `NEXT_PUBLIC_*` env vars into the client bundle (`.next/static/...`). So your **Supabase anon key** (a JWT) appears in the built JS and is flagged as a secret even though it’s meant to be public.

---

## Fix: Safelist the false positive (recommended)

Tell Netlify that your Supabase anon key is not a secret:

1. In Netlify: **Site** → **Project configuration** (or **Site configuration**) → **Environment variables**.
2. **Add a variable** (or **Add a single variable**):
   - **Key:** `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES`
   - **Value:** your Supabase anon key value (the full JWT string).
   - If you have more than one false positive (e.g. another public key), use a **comma-separated** list of those strings.
3. **Save** and **Trigger deploy** (or push a new commit).

After that, the scanner will no longer treat that value as a secret and the build can pass.

---

## Alternative: Disable smart detection

Only if you understand the risk:

1. **Environment variables** → Add (or edit):
   - **Key:** `SECRETS_SCAN_SMART_DETECTION_ENABLED`
   - **Value:** `false`
2. Redeploy.

Note: Standard secret scanning (for env vars you mark as secret) still runs. To disable **all** secret scanning, set `SECRETS_SCAN_ENABLED=false` (not recommended).

---

## Checklist

- [ ] No `.env` or `.env.local` (or other env files with secrets) are committed. Use **Netlify env vars** for all secrets.
- [ ] `.gitignore` includes `.env`, `.env.local`, `.env*.local` (this repo already does).
- [ ] All required keys are set in **Netlify** (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BACKEND_URL`, `HUNTER_RUN_SECRET`, `RESEND_API_KEY`, etc.).
- [ ] Safelist the anon key with `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES` (or disable smart detection), then redeploy.

See [Netlify: Secret scanning](https://docs.netlify.com/manage/security/secret-scanning/).
