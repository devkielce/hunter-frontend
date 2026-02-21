import { unstable_noStore } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";
import { ListingDashboard } from "@/components/ListingDashboard";
import { RefreshScrapersButton } from "@/components/RefreshScrapersButtonDynamic";
import type { Listing } from "@/types/listing";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const LISTING_SOURCES = ["komornik", "e_licytacje", "elicytacje", "facebook"] as const;

type GetListingsResult = {
  listings: Listing[];
  error: string | null;
};

async function getListings(options?: { showRemovedFromSource?: boolean }): Promise<GetListingsResult> {
  unstable_noStore();

  const supabase = createServerClient();
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.NEXT_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return {
      listings: [],
      error:
        "Brak konfiguracji Supabase (ustaw NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_URL oraz SUPABASE_SERVICE_ROLE_KEY w Vercel).",
    };
  }

  const showRemoved = options?.showRemovedFromSource === true;
  const results = await Promise.allSettled(
    LISTING_SOURCES.map((source) => {
      let q = supabase
        .from("listings")
        .select("*")
        .eq("source", source)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(2000);
      if (showRemoved) {
        q = q.not("removed_from_source_at", "is", null);
      } else {
        q = q.is("removed_from_source_at", null);
      }
      return q;
    })
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
    removed_from_source_at:
      row.removed_from_source_at != null ? String(row.removed_from_source_at).trim() : null,
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

export default async function DashboardPage(props: {
  searchParams?: Promise<{ removed?: string }>;
}) {
  let listings: Listing[] = [];
  let fetchError: string | null = null;
  const searchParams = (await props.searchParams) ?? {};
  const showRemoved = searchParams.removed === "1";

  try {
    const result = await getListings({ showRemovedFromSource: showRemoved });
    listings = result.listings ?? [];
    fetchError = result.error;
  } catch (e) {
    console.error("[DashboardPage] getListings threw", e);
    fetchError = `Błąd ładowania: ${e instanceof Error ? e.message : String(e)}`;
  }

  const priceRange = getPriceRange(listings);

  const deployId =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.VERCEL_COMMIT_SHA?.slice(0, 7) ?? "local";
  const supabaseUrlStatus =
    (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      process.env.NEXT_SUPABASE_URL?.trim() ||
      process.env.SUPABASE_URL?.trim())
      ? "ok"
      : "missing";
  const supabaseServiceKeyStatus = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ? "ok" : "missing";
  const connectionOk = supabaseUrlStatus === "ok" && supabaseServiceKeyStatus === "ok";

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
          showRemovedFromSource={showRemoved}
        />
        <footer className="mt-12 border-t border-neutral-200 pt-4">
          <p className="text-xs text-neutral-400" aria-label="Deploy and connection debug">
            Deploy: <code className="rounded bg-neutral-100 px-1">{deployId}</code>
            {" · "}
            Supabase URL: <code className="rounded bg-neutral-100 px-1">{supabaseUrlStatus}</code>
            {" · "}
            Service key: <code className="rounded bg-neutral-100 px-1">{supabaseServiceKeyStatus}</code>
            {!connectionOk && (
              <span className="ml-2 text-amber-600">
                — Ustaw SUPABASE_URL (lub NEXT_PUBLIC_SUPABASE_URL) i SUPABASE_SERVICE_ROLE_KEY w Vercel → Settings → Environment Variables, potem redeploy.
              </span>
            )}
          </p>
        </footer>
      </main>
    </div>
  );
}
