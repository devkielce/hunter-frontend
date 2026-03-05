"use client";

import type { ListingSource, ListingStatus } from "@/types/listing";
import { LISTING_STATUSES, getSourceConfig } from "@/types/listing";

export interface FilterState {
  source: ListingSource | "";
  status: ListingStatus | "";
  city: string;
  region: string;
  priceMin: number;
  priceMax: number;
  sortByPrice: "asc" | "desc" | "";
  /** Sort by investment_score descending. */
  sortByScore: "" | "desc";
  /** Min investment_score (0 = no filter). */
  minScore: number;
}

interface ListingFiltersProps {
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  sources: string[];
  cities: string[];
  regions: string[];
  priceRange: { min: number; max: number };
}

function formatPriceGrosze(grosze: number): string {
  const zl = Math.floor(grosze / 100);
  return String(zl).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " zł";
}

const selectClass =
  "min-w-[140px] h-9 rounded-md border border-[hsl(var(--card-border))] bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50";

const MIN_SCORE_OPTIONS = [0, 50, 70, 80] as const;

export function ListingFilters({
  filters,
  onFiltersChange,
  sources,
  cities,
  regions,
  priceRange,
}: ListingFiltersProps) {
  const update = (patch: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  return (
    <div className="hunter-filter-bar">
      {/* Row of selects */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Źródło</label>
          <select
            value={filters.source}
            onChange={(e) => update({ source: e.target.value as ListingSource | "" })}
            className={selectClass}
          >
            <option value="">- WSZYSTKIE -</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {getSourceConfig(s).label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            value={filters.status}
            onChange={(e) => update({ status: e.target.value as ListingStatus | "" })}
            className={selectClass}
          >
            <option value="">- WSZYSTKIE -</option>
            {LISTING_STATUSES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Miasto</label>
          <select
            value={filters.city}
            onChange={(e) => update({ city: e.target.value })}
            className={selectClass}
          >
            <option value="">- WSZYSTKIE -</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Województwo</label>
          <select
            value={filters.region}
            onChange={(e) => update({ region: e.target.value })}
            className={selectClass}
          >
            <option value="">- WSZYSTKIE -</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Sortowanie</label>
          <select
            value={filters.sortByScore ? "score_desc" : filters.sortByPrice || "default"}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "score_desc") {
                update({ sortByScore: "desc", sortByPrice: "" });
              } else {
                update({ sortByScore: "", sortByPrice: (v === "asc" ? "asc" : v === "desc" ? "desc" : "") as "asc" | "desc" | "" });
              }
            }}
            className={selectClass}
          >
            <option value="default">Domyślne (data)</option>
            <option value="asc">Cena: rosnąco</option>
            <option value="desc">Cena: malejąco</option>
            <option value="score_desc">Potencjał inwest.: malejąco</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Min. potencjał</label>
          <select
            value={filters.minScore}
            onChange={(e) => update({ minScore: Number(e.target.value) })}
            className={selectClass}
          >
            <option value={0}>Wszystkie</option>
            {MIN_SCORE_OPTIONS.filter((s) => s > 0).map((s) => (
              <option key={s} value={s}>
                ≥ {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Price range — separate row */}
      <div className="mt-3 pt-3 border-t border-[hsl(var(--card-border))] w-full max-w-md">
        <label className="text-xs font-medium text-muted-foreground block mb-1">
          Cena (PLN)
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
            className="flex-1 h-2 rounded-full appearance-none bg-[hsl(var(--card-border))] accent-accent"
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
            className="flex-1 h-2 rounded-full appearance-none bg-[hsl(var(--card-border))] accent-accent"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {formatPriceGrosze(filters.priceMin)} – {formatPriceGrosze(filters.priceMax)}
        </p>
      </div>
    </div>
  );
}
