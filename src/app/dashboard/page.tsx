import nextDynamic from "next/dynamic";
import { unstable_noStore } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";
import { ListingDashboard } from "@/components/ListingDashboard";
import type { Listing } from "@/types/listing";

const RefreshScrapersButton = nextDynamic(
  () =>
    import("@/components/RefreshScrapersButton").then((m) => ({
      default: m.RefreshScrapersButton,
    })),
  { ssr: false }
);

// TEMP: test if hydration error is caused by live data changing between SSR and client
// If error disappears with revalidate=60, it was data churn. Restore force-dynamic + revalidate=0 after test.
export const revalidate = 60;
// export const dynamic = "force-dynamic";
// export const revalidate = 0;
export const runtime = "nodejs";

const LISTING_SOURCES = ["komornik", "e_licytacje", "elicytacje", "facebook"] as const;

type GetListingsResult = {
  listings: Listing[];
  error: string | null;
};

async function getListings(): Promise<GetListingsResult> {
  unstable_noStore();
  console.log("[getListings] start", {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  const supabase = createServerClient();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      listings: [],
      error:
        "Brak konfiguracji Supabase (NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY). Sprawdź .env.local i zmienne w Vercel.",
    };
  }

  // Fetch each source in parallel so we always get all sources (avoids single-query 1000 row limit and ordering issues).
  const results = await Promise.allSettled(
    LISTING_SOURCES.map((source) =>
      supabase
        .from("listings")
        .select("*")
        .eq("source", source)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(2000)
    )
  );

  const allRows: Record<string, unknown>[] = [];
  const errors: string[] = [];
  results.forEach((outcome, i) => {
    const source = LISTING_SOURCES[i];
    if (outcome.status === "rejected") {
      errors.push(`${source}: ${String(outcome.reason)}`);
      return;
    }
    const { data, error } = outcome.value;
    if (error) {
      errors.push(`${source}: ${error.message}`);
      return;
    }
    allRows.push(...(data ?? []));
  });

  if (errors.length > 0) {
    console.error("[getListings] partial errors", errors);
  }

  // Sort merged results by created_at desc, id desc
  allRows.sort((a, b) => {
    const aDate = String(a?.created_at ?? "");
    const bDate = String(b?.created_at ?? "");
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    const aId = String(a?.id ?? "");
    const bId = String(b?.id ?? "");
    return bId.localeCompare(aId);
  });

  const listings: Listing[] = [];
  for (const row of allRows) {
    try {
      listings.push(normalizeListing(row as Record<string, unknown>));
    } catch (e) {
      console.warn("[getListings] skip row", row?.id, e);
    }
  }

  console.log("[getListings] done", {
    count: listings.length,
    bySource: LISTING_SOURCES.map((s) => ({
      [s]: listings.filter((l) => l.source === s).length,
    })),
  });

  return {
    listings,
    error: errors.length === results.length ? errors.join("; ") : null,
  };
}

function normalizeListing(row: Record<string, unknown>): Listing {
  const created =
    row.created_at != null ? String(row.created_at).trim() : null;
  const updated =
    row.updated_at != null ? String(row.updated_at).trim() : null;

  const rawSource = String(row.source ?? "").trim();
  return {
    id: String(row.id),
    source: rawSource.toLowerCase(),
    source_url: String(row.source_url ?? ""),
    title: String(row.title ?? ""),
    description: row.description != null ? String(row.description) : null,
    price_pln: row.price_pln != null ? Number(row.price_pln) : null,
    city: row.city != null ? String(row.city) : null,
    location: row.location != null ? String(row.location) : null,
    region: row.region != null ? String(row.region) : null,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    status:
      row.status != null && typeof row.status === "string"
        ? (row.status as Listing["status"])
        : "new",
    auction_date: (() => {
      const v = row.auction_date;
      if (v == null) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    })(),
    created_at: created,
    updated_at: updated,
    notified: Boolean(row.notified),
  };
}

function getPriceRange(listings: Listing[]): { min: number; max: number } {
  const prices = listings
    .map((l) => l.price_pln)
    .filter((p): p is number => p != null && p > 0);
  if (prices.length === 0) return { min: 0, max: 500_000_00 };
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export default async function DashboardPage() {
  let listings: Listing[] = [];
  let fetchError: string | null = null;

  try {
    const result = await getListings();
    listings = result.listings ?? [];
    fetchError = result.error;
  } catch (e) {
    console.error("[DashboardPage] getListings threw", e);
    fetchError = `Błąd ładowania: ${e instanceof Error ? e.message : String(e)}`;
  }

  const priceRange = getPriceRange(listings);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              Hunter – Okazje nieruchomościowe
            </h1>
            <p className="text-sm text-neutral-500">
              Lista ofert z komornika, e-licytacji i Facebooka
            </p>
          </div>
          <RefreshScrapersButton />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {fetchError && (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <strong>Błąd połączenia z bazą:</strong> {fetchError}
          </div>
        )}
        <ListingDashboard
          initialListings={listings}
          priceRange={priceRange}
        />
      </main>
    </div>
  );
}
