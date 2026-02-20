import { createServerClient } from "@/lib/supabase-server";
import { ListingDashboard } from "@/components/ListingDashboard";
import { RefreshScrapersButton } from "@/components/RefreshScrapersButton";
import type { Listing } from "@/types/listing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getListings(): Promise<
  { listings: Listing[]; error: string | null }
> {
  const supabase = createServerClient();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      listings: [],
      error:
        "Brak konfiguracji Supabase (NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY). Sprawdź .env.local i zmienne w Vercel.",
    };
  }
  // Fetch all listings; do not filter by source so komornik, e_licytacje, and facebook all appear.
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("listings fetch error", error);
    return {
      listings: [],
      error: `Nie udało się załadować ofert: ${error.message}. Sprawdź, czy frontend używa tego samego projektu Supabase co backend (scrapery).`,
    };
  }
  return {
    listings: (data ?? []).map(normalizeListing),
    error: null,
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

/** One static listing for HYDRATION_DEBUG=static. Remove after debugging. */
const STATIC_LISTING: Listing = {
  id: "debug-static-1",
  source: "komornik",
  source_url: "https://example.com/1",
  title: "Static test listing",
  description: null,
  price_pln: 200_000_00,
  city: "Kielce",
  location: null,
  images: [],
  status: "new",
  auction_date: "2025-12-01T10:00:00.000Z",
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: null,
  notified: false,
};

export default async function DashboardPage() {
  const debugMode = process.env.NEXT_PUBLIC_HYDRATION_DEBUG;

  let listings: Listing[];
  let fetchError: string | null = null;

  if (debugMode === "minimal") {
    listings = [];
  } else if (debugMode === "static") {
    listings = [STATIC_LISTING];
  } else {
    const result = await getListings();
    listings = result.listings ?? [];
    fetchError = result.error;
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
        {debugMode === "minimal" && (
          <p className="text-sm text-neutral-500">HYDRATION_DEBUG=minimal</p>
        )}
        {fetchError && (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <strong>Błąd połączenia z bazą:</strong> {fetchError}
          </div>
        )}
        {debugMode === "minimal" ? (
          <div>Dashboard</div>
        ) : (
          <ListingDashboard
            initialListings={listings}
            priceRange={priceRange}
          />
        )}
      </main>
    </div>
  );
}
