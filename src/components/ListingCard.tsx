"use client";

import Image from "next/image";
import { useMounted } from "@/hooks/useMounted";
import type { Listing, ListingStatus } from "@/types/listing";
import { getSourceConfig, getSourceBadgeClass, LISTING_STATUSES } from "@/types/listing";

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

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--card-border))] overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-foreground tabular-nums w-8 text-right">
        {score}/100
      </span>
    </div>
  );
}

/** Uproszczona karta oferty: zdjęcie | tytuł + opis | cena + scoring + statusy */
export function ListingCard({ listing, onStatusChange }: ListingCardProps) {
  const mounted = useMounted();
  const sourceConfig = getSourceConfig(listing.source);
  const badgeClass = getSourceBadgeClass(listing.source);
  const firstImage = listing.images?.[0];
  const isNew = isNewToday(listing.created_at);
  const displayDescription = listing.ai_description || listing.description;

  return (
    <article className="hunter-card-row flex flex-col md:flex-row animate-fade-in min-h-0">
      {/* LEFT: Image (clickable) + badges overlay */}
      <a
        href={listing.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="listing-image-row relative w-full md:w-52 md:min-w-[13rem] aspect-[16/10] md:aspect-auto md:self-stretch shrink-0 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-l overflow-hidden"
        tabIndex={0}
        aria-label={listing.title || "Przejdź do oferty"}
      >
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
      </a>

      {/* MIDDLE: Title + description (both clickable) */}
      <div className="flex-1 p-4 min-w-0 flex flex-col">
        <h2 className="font-medium text-foreground line-clamp-2 text-sm mb-2">
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
          >
            {listing.title || "Bez tytułu"}
          </a>
        </h2>

        {displayDescription && (
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground line-clamp-3 hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
          >
            {displayDescription}
          </a>
        )}
      </div>

      {/* RIGHT: Price, investment score, status buttons */}
      <div className="w-full md:w-56 md:min-w-[14rem] shrink-0 border-t md:border-t-0 md:border-l border-[hsl(var(--card-border))] p-4 flex flex-col gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Cena wywoławcza:</p>
          <p className="font-display text-lg font-bold text-foreground">
            {formatPrice(listing.price_pln)}
          </p>
        </div>

        {listing.investment_score != null && listing.investment_score >= 0 && listing.investment_score <= 100 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Potencjał inwest.:</p>
            <ScoreBar score={listing.investment_score} />
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
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
