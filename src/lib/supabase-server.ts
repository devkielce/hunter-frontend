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

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
    global: { fetch: noStoreFetch },
  });
}
