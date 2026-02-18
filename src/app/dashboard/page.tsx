import { createServerClient } from "@/lib/supabase-server";
import { ListingDashboard } from "@/components/ListingDashboard";
import { RefreshScrapersButton } from "@/components/RefreshScrapersButton";
import type { Listing } from "@/types/listing";

export const dynamic = "force-dynamic";

async function getListings(): Promise<Listing[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listings fetch error", error);
    return [];
  }
  return (data ?? []).map(normalizeListing);
}

function normalizeListing(row: Record<string, unknown>): Listing {
  return {
    id: String(row.id),
    source: String(row.source ?? ""),
    source_url: String(row.source_url ?? ""),
    title: String(row.title ?? ""),
    description: row.description != null ? String(row.description) : null,
    price_pln:
      row.price_pln != null ? Number(row.price_pln) : null,
    city: row.city != null ? String(row.city) : null,
    location: row.location != null ? String(row.location) : null,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    status:
      row.status != null && typeof row.status === "string"
        ? (row.status as Listing["status"])
        : "new",
    auction_date:
      row.auction_date != null ? String(row.auction_date) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
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
  const listings = await getListings();
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
        <ListingDashboard
          initialListings={listings}
          priceRange={priceRange}
        />
      </main>
    </div>
  );
}
