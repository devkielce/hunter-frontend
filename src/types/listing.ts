export type ListingStatus = "new" | "contacted" | "viewed" | "archived";

export type ListingSource =
  | "facebook"
  | "komornik"
  | "e_licytacje"
  | "elicytacje"
  | string;

export interface Listing {
  id: string;
  source: ListingSource;
  source_url: string;
  title: string;
  description: string | null;
  price_pln: number | null; // w groszach (wyświetlanie: price_pln / 100)
  city: string | null;
  location: string | null;
  region?: string | null;
  images: string[];
  status: ListingStatus | null;
  auction_date: string | null; // ISO
  created_at: string | null;
  updated_at: string | null;
  notified: boolean;
  /** When set, listing was removed from the source (e.g. auction ended); hide from default view. */
  removed_from_source_at?: string | null;
  /** Powierzchnia użytkowa w m² (z backendu lub raw_data). */
  surface_m2?: number | null;
  /** Potencjał inwestycyjny 0–100 (z raw_data.investment_score). */
  investment_score?: number | null;
}

export const LISTING_STATUSES: { value: ListingStatus; label: string }[] = [
  { value: "new", label: "Nowy" },
  { value: "contacted", label: "Skontaktowano" },
  { value: "viewed", label: "Obejrzano" },
  { value: "archived", label: "Zarchiwizowano" },
];

export const SOURCE_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  facebook: { label: "Facebook", color: "bg-blue-600", icon: "📘" },
  komornik: { label: "Komornik", color: "bg-amber-600", icon: "⚖️" },
  e_licytacje: { label: "e-Licytacje", color: "bg-emerald-600", icon: "🔨" },
  elicytacje: { label: "e-Licytacje", color: "bg-emerald-600", icon: "🔨" },
  amw: { label: "AMW (Nieruchomości)", color: "bg-slate-700", icon: "🏛️" },
  olx: { label: "OLX", color: "bg-green-600", icon: "🟢" },
  otodom: { label: "Otodom", color: "bg-orange-600", icon: "🏠" },
  gratka: { label: "Gratka", color: "bg-rose-600", icon: "📋" },
};

export function getSourceConfig(source: string) {
  return (
    SOURCE_CONFIG[source] ?? {
      label: source,
      color: "bg-gray-600",
      icon: "📋",
    }
  );
}

/** CSS class for Hunter design system source badge (e.g. source-badge-komornik). */
const SOURCE_BADGE_CLASSES: Record<string, string> = {
  komornik: "source-badge-komornik",
  e_licytacje: "source-badge-e_licytacje",
  elicytacje: "source-badge-elicytacje",
  facebook: "source-badge-facebook",
  amw: "source-badge-amw",
};

export function getSourceBadgeClass(source: string): string {
  return SOURCE_BADGE_CLASSES[source] ?? "source-badge-default";
}
