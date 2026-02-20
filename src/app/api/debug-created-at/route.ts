import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/debug-created-at
 * Returns the created_at format as returned by Supabase on this environment (e.g. Vercel).
 * Open in browser or: curl https://your-app.vercel.app/api/debug-created-at
 * Remove this route after comparing local vs Vercel formats.
 */
export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return Response.json(
      { error: "Missing Supabase env vars" },
      { status: 500 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return Response.json(
      { error: error.message, created_at_raw: null, created_at_normalized: null },
      { status: 200 }
    );
  }

  const row = data as { created_at?: unknown } | null;
  const raw = row?.created_at;
  const normalized = raw != null ? String(raw).trim() : null;

  return Response.json({
    created_at_raw: raw,
    created_at_raw_type: typeof raw,
    created_at_normalized: normalized,
    hint: "Compare this with local: open http://localhost:3000/api/debug-created-at",
  });
}
