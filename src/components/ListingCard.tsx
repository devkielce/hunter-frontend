"use client";

import Image from "next/image";
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
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(pricePln / 100);
}

function isNewToday(createdAt: string): boolean {
  const created = new Date(createdAt);
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
  return d.toLocaleString("pl-PL");
}

export function ListingCard({ listing, onStatusChange }: ListingCardProps) {
  const sourceConfig = getSourceConfig(listing.source);
  const firstImage = listing.images?.[0];
  const desc = listing.description?.trim();
  const preview =
    (desc && desc !== "undefined" && desc !== "null"
      ? desc.slice(0, 120) + (desc.length > 120 ? "…" : "")
      : null) || "—";

  return (
    <article className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-2 p-3 border-b border-neutral-100">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${sourceConfig.color}`}
        >
          <span>{sourceConfig.icon}</span>
          {sourceConfig.label}
        </span>
        {isNewToday(listing.created_at) && (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            NOWE (dzisiaj)
          </span>
        )}
      </div>

      {firstImage && (
        <div className="relative aspect-video w-full bg-neutral-100">
          <Image
            src={firstImage}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <h2 className="font-semibold text-neutral-900 line-clamp-2 mb-1">
          <a
            href={listing.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {listing.title || "Bez tytułu"}
          </a>
        </h2>
        <p className="text-lg font-medium text-neutral-800 mb-1">
          {formatPrice(listing.price_pln)}
        </p>
        <p className="text-sm text-neutral-500 mb-2">
          {[listing.location, listing.city].filter(Boolean).join(", ") || "—"}
        </p>
        {(() => {
          const displayDate =
            listing.auction_date && String(listing.auction_date).trim() !== ""
              ? listing.auction_date
              : listing.created_at;
          const isAuction =
            listing.auction_date &&
            String(listing.auction_date).trim() !== "" &&
            !Number.isNaN(new Date(listing.auction_date).getTime());
          return (
            <p className="text-sm mb-2">
              {isAuction ? (
                <>
                  Licytacja:{" "}
                  <Countdown auctionDate={listing.auction_date!} />
                  <span className="text-neutral-400 ml-1">
                    ({formatDate(displayDate)})
                  </span>
                </>
              ) : (
                <span className="text-neutral-500">
                  Dodano: {formatDate(displayDate)}
                </span>
              )}
            </p>
          );
        })()}
        <p className="text-sm text-neutral-600 line-clamp-2 mb-4">{preview}</p>

        <div className="mt-auto flex flex-wrap gap-2">
          {LISTING_STATUSES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onStatusChange(listing.id, value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                (listing.status ?? "new") === value
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
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
