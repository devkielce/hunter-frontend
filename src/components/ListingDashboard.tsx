"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Listing, ListingStatus } from "@/types/listing";
import { ListingCard } from "./ListingCard";
import { ListingFilters, type FilterState } from "./ListingFilters";

interface ListingDashboardProps {
  initialListings: Listing[];
  priceRange: { min: number; max: number };
  /** When true, the list shows only listings removed from source (removed_from_source_at IS NOT NULL). */
  showRemovedFromSource?: boolean;
}

const defaultFilters: FilterState = {
  source: "",
  status: "",
  city: "",
  region: "",
  priceMin: 0,
  priceMax: 500_000_00,
  sortByPrice: "",
  sortByScore: "desc",
  minScore: 0,
};

export function ListingDashboard({
  initialListings,
  priceRange,
  showRemovedFromSource = false,
}: ListingDashboardProps) {
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    priceMin: priceRange.min,
    priceMax: priceRange.max,
  });
  const [listings, setListings] = useState<Listing[]>(initialListings);

  // Sync when server refetches (e.g. after "Odśwież oferty" or run completion)
  useEffect(() => {
    setListings(initialListings);
    setFilters((f) => ({
      ...f,
      priceMin: priceRange.min,
      priceMax: priceRange.max,
    }));
  }, [initialListings, priceRange.min, priceRange.max]);

  const sources = useMemo(
    () =>
      Array.from(
        new Set(listings.map((l) => l.source).filter(Boolean))
      ).sort(),
    [listings]
  );
  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          listings.map((l) => l.city).filter((c): c is string => Boolean(c))
        )
      ).sort(),
    [listings]
  );
  const regions = useMemo(
    () =>
      Array.from(
        new Set(
          listings.map((l) => l.region).filter((r): r is string => Boolean(r))
        )
      ).sort(),
    [listings]
  );

  const filteredAndSorted = useMemo(() => {
    let result = listings.filter((l) => {
      if (filters.source && l.source !== filters.source) return false;
      const status = l.status ?? "new";
      if (filters.status && status !== filters.status) return false;
      if (filters.city && l.city !== filters.city) return false;
      if (filters.region && l.region !== filters.region) return false;
      const price = l.price_pln ?? 0;
      if (price < filters.priceMin || price > filters.priceMax) return false;
      if (filters.minScore > 0) {
        const score = l.investment_score ?? 0;
        if (score < filters.minScore) return false;
      }
      return true;
    });
    if (filters.sortByScore === "desc") {
      result = [...result].sort((a, b) => {
        const sa = a.investment_score ?? -1;
        const sb = b.investment_score ?? -1;
        return sb - sa;
      });
    } else if (filters.sortByPrice === "asc") {
      result = [...result].sort(
        (a, b) => (a.price_pln ?? 0) - (b.price_pln ?? 0)
      );
    } else if (filters.sortByPrice === "desc") {
      result = [...result].sort(
        (a, b) => (b.price_pln ?? 0) - (a.price_pln ?? 0)
      );
    }
    return result;
  }, [listings, filters]);

  const updateStatus = useCallback(async (id: string, status: ListingStatus) => {
    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <ListingFilters
        filters={filters}
        onFiltersChange={setFilters}
        sources={sources}
        cities={cities}
        regions={regions}
        priceRange={priceRange}
      />

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          Pokazano <strong className="text-foreground">{filteredAndSorted.length}</strong> z{" "}
          <strong className="text-foreground">{listings.length}</strong> ofert
          {showRemovedFromSource && " (usunięte ze źródła)"}
        </p>
        {showRemovedFromSource ? (
          <Link
            href="/dashboard"
            className="text-sm font-medium text-accent hover:underline"
          >
            ← Pokaż tylko aktywne
          </Link>
        ) : (
          <Link
            href="/dashboard?removed=1"
            className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            Pokaż usunięte ze źródła
          </Link>
        )}
      </div>

      {filteredAndSorted.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredAndSorted.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onStatusChange={updateStatus}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">
          Brak ofert spełniających kryteria.
        </p>
      )}
    </div>
  );
}
