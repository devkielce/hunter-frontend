"use client";

import { useMemo, useState, useCallback } from "react";
import type { Listing, ListingStatus } from "@/types/listing";
import { ListingCard } from "./ListingCard";
import { ListingFilters, type FilterState } from "./ListingFilters";

interface ListingDashboardProps {
  initialListings: Listing[];
  priceRange: { min: number; max: number };
}

const defaultFilters: FilterState = {
  source: "",
  status: "",
  city: "",
  priceMin: 0,
  priceMax: 500_000_00, // 5M PLN w groszach – nadpisane przez priceRange
  sortByPrice: "",
};

export function ListingDashboard({
  initialListings,
  priceRange,
}: ListingDashboardProps) {
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    priceMin: priceRange.min,
    priceMax: priceRange.max,
  });
  const [listings, setListings] = useState<Listing[]>(initialListings);

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

  const filteredAndSorted = useMemo(() => {
    let result = listings.filter((l) => {
      if (filters.source && l.source !== filters.source) return false;
      const status = l.status ?? "new";
      if (filters.status && status !== filters.status) return false;
      if (filters.city && l.city !== filters.city) return false;
      const price = l.price_pln ?? 0;
      if (price < filters.priceMin || price > filters.priceMax) return false;
      return true;
    });
    if (filters.sortByPrice === "asc") {
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
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <ListingFilters
          filters={filters}
          onFiltersChange={setFilters}
          sources={sources}
          cities={cities}
          priceRange={priceRange}
        />
      </aside>
      <div>
        <p className="text-sm text-neutral-500 mb-4">
          Pokazano <strong>{filteredAndSorted.length}</strong> z{" "}
          <strong>{listings.length}</strong> ofert
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAndSorted.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onStatusChange={updateStatus}
            />
          ))}
        </div>
        {filteredAndSorted.length === 0 && (
          <p className="text-center text-neutral-500 py-12">
            Brak ofert spełniających kryteria.
          </p>
        )}
      </div>
    </div>
  );
}
