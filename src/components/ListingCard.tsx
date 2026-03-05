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
  if (pricePln == null) return "Do ustalenia";
  const zl = Math.floor(pricePln / 100);
  const s = String(zl).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return s + " zł";
}

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
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

/** Karta oferty w stylu Adradar: poziomy wiersz (zdjęcie | treść | cena). */
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
  const isNew = isNewToday(listing.created_at);

  return (
    <article className="hunter-card-row flex flex-col md:flex-row animate-fade-in min-h-0">
      {/* LEFT: Image + badges overlay */}
      <div className="listing-image-row relative w-full md:w-52 md:min-w-[13rem] aspect-[16/10] md:aspect-auto md:self-stretch shrink-0">
        {firstImage ? (
          <Image
            src={firstImage}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 208px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50 bg-[hsl(var(--card-border))]">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <span
          className={`absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
        >
          {sourceConfig.icon} {sourceConfig.label}
        </span>
        {mounted && isNew && (
          <span className="absolute top-2 right-2 rounded-full bg-emerald-500/90 text-white px-2 py-0.5 text-xs font-medium">
            NOWE
          </span>
        )}
      </div>

      {/* MIDDLE: Title, description, location, date, link */}
      <div className="flex-1 p-4 min-w-0 flex flex-col">
        <h2 className="font-medium text-foreground line-clamp-2 text-sm mb-1">
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
          >
            {listing.title || "Bez tytułu"}
          </a>
        </h2>

        {listing.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
            {listing.description}
          </p>
        )}

        {(listing.city || listing.location) && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
            <MapPin />
            <span>{locationLine}</span>
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5" suppressHydrationWarning>
            <Calendar />
            {!mounted ? (
              "—"
            ) : isAuction ? (
              <>
                Licytacja: {formatDateTime(listing.auction_date!)}
                {" "}
                ({<Countdown auctionDate={listing.auction_date!} />})
              </>
            ) : (
              <>Dodano: {displayDate ? formatDate(displayDate) : "—"}</>
            )}
          </span>
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent hover:underline"
          >
            Szczegóły
          </a>
        </div>
      </div>

      {/* RIGHT: Price, surface, term, status buttons */}
      <div className="w-full md:w-56 md:min-w-[14rem] shrink-0 border-t md:border-t-0 md:border-l border-[hsl(var(--card-border))] p-4 flex flex-col gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Cena wywoławcza:</p>
          <p className="font-display text-lg font-bold text-foreground">
            {formatPrice(listing.price_pln)}
          </p>
          {pricePerSqm != null && (
            <p className="text-sm text-muted-foreground">{pricePerSqm}</p>
          )}
        </div>

        {listing.surface_m2 != null && listing.surface_m2 > 0 && (
          <span className="inline-flex w-fit rounded border border-[hsl(var(--card-border))] px-2 py-1 text-sm text-foreground">
            {Number(listing.surface_m2) === Math.floor(listing.surface_m2)
              ? `${listing.surface_m2} m²`
              : `${Number(listing.surface_m2).toFixed(1).replace(".", ",")} m²`}
          </span>
        )}

        {listing.auction_date && isAuction && (
          <p className="text-xs text-muted-foreground">
            Termin: {formatDate(listing.auction_date)}
          </p>
        )}

        {listing.investment_score != null && listing.investment_score >= 0 && listing.investment_score <= 100 && (
          <p className="text-xs text-muted-foreground">
            Potencjał inwest.: <span className="font-medium text-foreground">{listing.investment_score}</span>/100
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
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
