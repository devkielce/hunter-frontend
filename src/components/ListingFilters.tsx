"use client";

import type { ListingSource, ListingStatus } from "@/types/listing";
import { LISTING_STATUSES, getSourceConfig } from "@/types/listing";

export interface FilterState {
  source: ListingSource | "";
  status: ListingStatus | "";
  city: string;
  priceMin: number;
  priceMax: number;
  sortByPrice: "asc" | "desc" | "";
}

interface ListingFiltersProps {
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  sources: string[];
  cities: string[];
  priceRange: { min: number; max: number };
}

export function ListingFilters({
  filters,
  onFiltersChange,
  sources,
  cities,
  priceRange,
}: ListingFiltersProps) {
  const update = (patch: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-4">
      <h3 className="font-semibold text-neutral-900">Filtry</h3>

      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1">
          Źródło
        </label>
        <select
          value={filters.source}
          onChange={(e) => update({ source: e.target.value as ListingSource | "" })}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Wszystkie</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {getSourceConfig(s).label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1">
          Status
        </label>
        <select
          value={filters.status}
          onChange={(e) => update({ status: e.target.value as ListingStatus | "" })}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Wszystkie</option>
          {LISTING_STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1">
          Miasto
        </label>
        <select
          value={filters.city}
          onChange={(e) => update({ city: e.target.value })}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Wszystkie</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1">
          Cena (PLN): {filters.priceMin / 100} – {filters.priceMax / 100}
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={10000}
            value={filters.priceMin}
            onChange={(e) =>
              update({
                priceMin: Number(e.target.value),
                priceMax: Math.max(Number(e.target.value), filters.priceMax),
              })
            }
            className="flex-1"
          />
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={10000}
            value={filters.priceMax}
            onChange={(e) =>
              update({
                priceMax: Number(e.target.value),
                priceMin: Math.min(Number(e.target.value), filters.priceMin),
              })
            }
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1">
          Sortowanie po cenie
        </label>
        <select
          value={filters.sortByPrice}
          onChange={(e) =>
            update({
              sortByPrice: e.target.value as "asc" | "desc" | "",
            })
          }
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Domyślne (data)</option>
          <option value="asc">Cena: rosnąco</option>
          <option value="desc">Cena: malejąco</option>
        </select>
      </div>
    </div>
  );
}
