import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** fetch that opts out of Next.js Data Cache so listings are always fresh */
function noStoreFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  return fetch(input, {
    ...init,
    cache: "no-store",
  } as RequestInit);
}

/** URL Supabase: prefer NEXT_PUBLIC_SUPABASE_URL, fallback to common Vercel names. */
function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.NEXT_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    ""
  );
}

export function createServerClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      !supabaseUrl
        ? "supabaseUrl is required. Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in Vercel."
        : "SUPABASE_SERVICE_ROLE_KEY is required."
    );
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
    global: { fetch: noStoreFetch },
  });
}
