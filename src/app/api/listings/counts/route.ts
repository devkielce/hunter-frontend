import { createServerClient } from "@/lib/supabase-server";

const SOURCES = ["komornik", "e_licytacje", "elicytacje", "facebook", "amw"] as const;

export type ListingCountsResponse = Record<string, number>;

/**
 * GET /api/listings/counts – returns how many listings exist per source.
 * Uses Supabase count (head: true) so no row data is transferred.
 */
export async function GET(): Promise<Response> {
  const supabase = createServerClient();
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.NEXT_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return Response.json(
      { error: "Supabase not configured (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 500 }
    );
  }

  const counts: ListingCountsResponse = {};
  await Promise.all(
    SOURCES.map(async (source) => {
      const { count, error } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("source", source)
        .is("removed_from_source_at", null);
      if (error) {
        counts[source] = 0;
        return;
      }
      counts[source] = count ?? 0;
    })
  );

  // e_licytacje and elicytacje might both exist; optionally merge for display
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return Response.json({
    bySource: counts,
    total,
  });
}
