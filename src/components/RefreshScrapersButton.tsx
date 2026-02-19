"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshScrapersButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [yesterdayOnly, setYesterdayOnly] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const body = yesterdayOnly ? { days_back: 1 } : {};
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fallback =
          res.status === 500
            ? "Server error (500). Check Vercel env: BACKEND_URL, HUNTER_RUN_SECRET; or Railway backend logs."
            : `Error ${res.status}`;
        setMessage({
          type: "error",
          text: (data.error as string) ?? fallback,
        });
        return;
      }
      if (data.configured === false && data.message) {
        setMessage({ type: "ok", text: data.message });
        return;
      }
      setMessage({
        type: "ok",
        text: data.results?.length
          ? `Zaktualizowano: ${data.results.map((r: { source: string; listings_upserted: number }) => `${r.source} (${r.listings_upserted})`).join(", ")}`
          : "Scrapery zakończone.",
      });
      router.refresh();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Błąd połączenia",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <label className="flex items-center gap-2 text-sm text-neutral-600">
        <input
          type="checkbox"
          checked={yesterdayOnly}
          onChange={(e) => setYesterdayOnly(e.target.checked)}
          disabled={loading}
          className="rounded border-neutral-300"
        />
        Test run (yesterday only)
      </label>
      <button
        type="button"
        onClick={handleRun}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
        aria-label={yesterdayOnly ? "Run scrapers for yesterday only" : "Run scrapers (refresh listings)"}
      >
        {loading ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
            Uruchamiam…
          </>
        ) : (
          <>
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Odśwież oferty
          </>
        )}
      </button>
      {message && (
        <p
          className={`text-xs ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}
          role="status"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
