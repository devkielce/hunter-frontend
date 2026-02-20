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

/** Temporary: no Intl to avoid hydration mismatch in production. Revert to Intl.NumberFormat("pl-PL", ...) after debugging. */
function formatPrice(pricePln: number | null): string {
  if (pricePln == null) return "Cena do ustalenia";
  const zl = Math.floor(pricePln / 100);
  const s = String(zl);
  const withSpaces = s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return withSpaces + " zł";
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

/** Deterministic date format (no Intl) to avoid server/client hydration mismatch. */
function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  const utc = d.getTime();
  const offset = getWarsawOffsetMs(d);
  const t = utc + offset;
  const w = new Date(t);
  const day = w.getUTCDate();
  const month = w.getUTCMonth() + 1;
  const year = w.getUTCFullYear();
  const h = w.getUTCHours();
  const min = w.getUTCMinutes();
  const sec = w.getUTCSeconds();
  return `${pad(day)}.${pad(month)}.${year}, ${pad(h)}:${pad(min)}:${pad(sec)}`;
}

/** Europe/Warsaw offset in ms for given date (DST: last Sun Mar – last Sun Oct). */
function getWarsawOffsetMs(d: Date): number {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const y = d.getUTCFullYear();
  const lastSunMar = lastSundayOfMonth(y, 3);
  const lastSunOct = lastSundayOfMonth(y, 10);
  // Zmiana czasu w UE: 1:00 UTC (2:00 lokalne), nie północ UTC
  const dstStart = lastSunMar + ONE_HOUR_MS;
  const dstEnd = lastSunOct + ONE_HOUR_MS;
  const t = d.getTime();
  const isDST = t >= dstStart && t < dstEnd;
  return (isDST ? 2 : 1) * ONE_HOUR_MS;
}

/** UTC timestamp of last Sunday of given month (month 1–12). */
function lastSundayOfMonth(year: number, month: number): number {
  const last = new Date(Date.UTC(year, month, 0));
  const day = last.getUTCDay();
  last.setUTCDate(last.getUTCDate() - (day === 0 ? 7 : day));
  return last.getTime();
}

/** Same card for every source (komornik, e_licytacje, facebook). Null auction_date/price_pln show "—" or "Cena do ustalenia". */
export function ListingCard({ listing, onStatusChange }: ListingCardProps) {
  const mounted = useMounted();
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
        <span
          suppressHydrationWarning
          className={
            mounted && isNewToday(listing.created_at)
              ? "rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
              : "invisible"
          }
        >
          {mounted && isNewToday(listing.created_at) ? "NOWE (dzisiaj)" : "\u200b"}
        </span>
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
        <p className="text-sm mb-2 text-neutral-500" suppressHydrationWarning>
          {(() => {
            const displayDate =
              listing.auction_date && String(listing.auction_date).trim() !== ""
                ? listing.auction_date
                : listing.created_at ?? "";
            const isAuction =
              listing.auction_date &&
              String(listing.auction_date).trim() !== "" &&
              !Number.isNaN(new Date(listing.auction_date).getTime());
            if (!mounted) {
              return isAuction ? "Licytacja: —" : "Dodano: —";
            }
            return isAuction ? (
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
            );
          })()}
        </p>
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
