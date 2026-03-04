"use client";

import Image from "next/image";
import { useMounted } from "@/hooks/useMounted";
import type { Listing, ListingStatus } from "@/types/listing";
import { getSourceConfig, getSourceBadgeClass, LISTING_STATUSES } from "@/types/listing";
import { Countdown } from "./Countdown";

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

const MapPin = () => (
  <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Calendar = () => (
  <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

/** Karta oferty w stylu Hunter design system: zdjęcie, cena (font-display), cena/m², metraż, lokalizacja (ikona), data/countdown, Zobacz, statusy. */
export function ListingCard({ listing, onStatusChange }: ListingCardProps) {
  const mounted = useMounted();
  const sourceConfig = getSourceConfig(listing.source);
  const badgeClass = getSourceBadgeClass(listing.source);
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
    <article className="hunter-card flex flex-col animate-fade-in">
      {/* Źródło + NOWE */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[hsl(var(--card-border))]">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
        >
          {sourceConfig.icon} {sourceConfig.label}
        </span>
        {mounted && isNewToday(listing.created_at) && (
          <span className="rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-xs font-medium">
            NOWE (dzisiaj)
          </span>
        )}
      </div>

      {/* Zdjęcie */}
      <div className="relative aspect-[16/10] w-full bg-[hsl(var(--card-border))]">
        {firstImage ? (
          <Image
            src={firstImage}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Treść: tytuł, CENA (display font), cena/m², metraż, lokalizacja, data, Zobacz, statusy */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <h2 className="font-medium text-foreground line-clamp-2 text-sm">
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
          >
            {listing.title || "Bez tytułu"}
          </a>
        </h2>

        <p className="font-display text-xl font-bold text-foreground">
          {formatPrice(listing.price_pln)}
        </p>

        {pricePerSqm != null && (
          <p className="text-sm text-muted-foreground">{pricePerSqm}</p>
        )}

        {listing.surface_m2 != null && listing.surface_m2 > 0 && (
          <p className="text-sm text-muted-foreground">
            {Number(listing.surface_m2) === Math.floor(listing.surface_m2)
              ? `${listing.surface_m2} m²`
              : `${Number(listing.surface_m2).toFixed(1).replace(".", ",")} m²`}
          </p>
        )}

        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <MapPin />
          <span>{locationLine}</span>
        </p>

        {/* Data / licytacja */}
        {displayDate && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5" suppressHydrationWarning>
            <Calendar />
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
          className="hunter-btn-primary inline-flex items-center justify-center mt-2 text-sm"
        >
          Zobacz
        </a>

        {/* Statusy */}
        <div className="mt-3 pt-3 border-t border-[hsl(var(--card-border))] flex flex-wrap gap-1.5">
          {LISTING_STATUSES.map(({ value, label }) => {
            const active = (listing.status ?? "new") === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onStatusChange(listing.id, value)}
                className={active ? "status-button-active" : "status-button-inactive"}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
