"use client";

import Image from "next/image";
import { useMounted } from "@/hooks/useMounted";
import type { Listing, ListingStatus } from "@/types/listing";
import { getSourceConfig } from "@/types/listing";
import { Countdown } from "./Countdown";
import { LISTING_STATUSES } from "@/types/listing";

interface ListingCardProps {
  listing: Listing;
  onStatusChange: (id: string, status: ListingStatus) => void;
}

function formatPrice(pricePln: number | null): string {
  if (pricePln == null) return "Cena do ustalenia";
  const zl = Math.floor(pricePln / 100);
  const s = String(zl);
  const withSpaces = s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return withSpaces + " zł";
}

/** Cena za m² (gdy mamy cenę i metraż). */
function formatPricePerSqm(pricePln: number | null, surfaceM2: number | null): string | null {
  if (pricePln == null || surfaceM2 == null || surfaceM2 <= 0) return null;
  const zlPerSqm = Math.round(pricePln / 100 / surfaceM2);
  const s = String(zlPerSqm).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return s + " zł/m²";
}

function isNewToday(createdAt: string | null): boolean {
  if (createdAt == null) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const today = new Date();
  return (
    created.getDate() === today.getDate() &&
    created.getMonth() === today.getMonth() &&
    created.getFullYear() === today.getFullYear()
  );
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${pad(day)}.${pad(month)}.${year}`;
}

/** Karta oferty w stylu Citihome: zdjęcie, cena, cena/m², metraż, lokalizacja, Zobacz. */
export function ListingCard({ listing, onStatusChange }: ListingCardProps) {
  const mounted = useMounted();
  const sourceConfig = getSourceConfig(listing.source);
  const firstImage = listing.images?.[0];
  const locationLine = [listing.city, listing.location].filter(Boolean).join(", ") || "—";
  const pricePerSqm = formatPricePerSqm(listing.price_pln, listing.surface_m2 ?? null);
  const displayDate =
    listing.auction_date && String(listing.auction_date).trim() !== ""
      ? listing.auction_date
      : listing.created_at ?? "";
  const isAuction =
    listing.auction_date &&
    String(listing.auction_date).trim() !== "" &&
    !Number.isNaN(new Date(listing.auction_date).getTime());

  return (
    <article className="flex flex-col rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Źródło + NOWE */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-neutral-100">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white ${sourceConfig.color}`}
        >
          {sourceConfig.icon} {sourceConfig.label}
        </span>
        {mounted && isNewToday(listing.created_at) && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            NOWE (dzisiaj)
          </span>
        )}
      </div>

      {/* Zdjęcie */}
      <div className="relative aspect-[16/10] w-full bg-neutral-100">
        {firstImage ? (
          <Image
            src={firstImage}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Treść: tytuł, CENA, cena/m², metraż, lokalizacja */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <h2 className="font-medium text-neutral-900 line-clamp-2 text-sm">
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {listing.title || "Bez tytułu"}
          </a>
        </h2>

        <p className="text-xl font-bold text-neutral-900">
          {formatPrice(listing.price_pln)}
        </p>

        {pricePerSqm != null && (
          <p className="text-sm text-neutral-500">{pricePerSqm}</p>
        )}

        {listing.surface_m2 != null && listing.surface_m2 > 0 && (
          <p className="text-sm text-neutral-600">
            {Number(listing.surface_m2) === Math.floor(listing.surface_m2)
              ? `${listing.surface_m2} m²`
              : `${Number(listing.surface_m2).toFixed(1).replace(".", ",")} m²`}
          </p>
        )}

        <p className="text-sm text-neutral-600">{locationLine}</p>

        {/* Data / licytacja */}
        {displayDate && (
          <p className="text-xs text-neutral-400" suppressHydrationWarning>
            {!mounted ? (
              "—"
            ) : isAuction ? (
              <>
                Licytacja: <Countdown auctionDate={listing.auction_date!} />
              </>
            ) : (
              <>Dodano: {formatDate(displayDate)}</>
            )}
          </p>
        )}

        <a
          href={listing.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center mt-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Zobacz
        </a>

        {/* Statusy */}
        <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-1.5">
          {LISTING_STATUSES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onStatusChange(listing.id, value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                (listing.status ?? "new") === value
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
