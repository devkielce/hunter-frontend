"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 2500;

export function RefreshScrapersButton() {
  const router = useRouter();
  const [refetchLoading, setRefetchLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  /** Odśwież oferty: only refetch list from DB (no scrapers). */
  const handleRefetch = async () => {
    setRefetchLoading(true);
    setMessage(null);
    await router.refresh();
    setMessage({ type: "ok", text: "Lista odświeżona." });
    setRefetchLoading(false);
  };

  /** Uruchom scrapery: POST /api/run, then poll GET /api/run/status until completed/error, then refetch. */
  const handleRunScrapers = async () => {
    setRunLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 409 = run already in progress; poll until completed then refresh
        if (res.status === 409) {
          setMessage({ type: "ok", text: "Scrapery już działają. Czekam na zakończenie…" });
          const final = await pollRunStatus();
          if (final.status === "completed" || final.status === "idle") {
            setMessage({ type: "ok", text: "Scrapery zakończone." });
            await router.refresh();
          } else if (final.status === "error") {
            setMessage({ type: "error", text: (final.error as string) ?? "Błąd." });
          }
          return;
        }
        const fallback =
          res.status === 500
            ? "Błąd serwera (500). Sprawdź Vercel: BACKEND_URL, HUNTER_RUN_SECRET oraz logi Railway."
            : res.status === 401
              ? "Brak autoryzacji. Ustaw HUNTER_RUN_SECRET w Vercel (ta sama wartość co APIFY_WEBHOOK_SECRET na Railway)."
              : `Błąd ${res.status}`;
        setMessage({
          type: "error",
          text: (data.error as string) ?? (data.message as string) ?? fallback,
        });
        return;
      }

      // 202 = run started in background; poll status until completed or error
      if (res.status === 202) {
        setMessage({ type: "ok", text: "Odświeżanie w toku…" });
        const final = await pollRunStatus();
        if (final.status === "completed") {
          setMessage({
            type: "ok",
            text: final.results?.length
              ? `Zaktualizowano: ${final.results.map((r: { source: string; listings_upserted?: number }) => `${r.source} (${r.listings_upserted ?? 0})`).join(", ")}`
              : "Scrapery zakończone.",
          });
          await router.refresh();
        } else if (final.status === "error") {
          setMessage({
            type: "error",
            text: (final.error as string) ?? "Błąd podczas uruchamiania scraperów.",
          });
          await router.refresh();
        } else {
          setMessage({ type: "ok", text: "Scrapery zakończone." });
          await router.refresh();
        }
        return;
      }

      // 200 with results (sync run)
      if (data.results?.length) {
        setMessage({
          type: "ok",
          text: `Zaktualizowano: ${data.results.map((r: { source: string; listings_upserted?: number }) => `${r.source} (${r.listings_upserted ?? 0})`).join(", ")}`,
        });
      } else {
        setMessage({ type: "ok", text: "Scrapery zakończone." });
      }
      await router.refresh();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Błąd połączenia",
      });
    } finally {
      setRunLoading(false);
    }
  };

  async function pollRunStatus(): Promise<{
    status: string;
    results?: unknown[];
    error?: string;
  }> {
    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch("/api/run/status");
          const data = await res.json().catch(() => ({}));
          const status = data.status as string | undefined;
          if (status === "completed" || status === "error" || status === "idle") {
            clearInterval(interval);
            resolve({
              status: status ?? "idle",
              results: data.results as unknown[] | undefined,
              error: data.error as string | undefined,
            });
          }
        } catch {
          clearInterval(interval);
          resolve({ status: "error", error: "Błąd połączenia z serwerem." });
        }
      }, POLL_INTERVAL_MS);

      // Safety: stop polling after 15 minutes
      setTimeout(() => {
        clearInterval(interval);
        resolve({ status: "error", error: "Przekroczono limit czasu oczekiwania." });
      }, 15 * 60 * 1000);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleRefetch}
          disabled={refetchLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
          aria-label="Odśwież listę ofert z bazy"
        >
          {refetchLoading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
              Odświeżam…
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
        <button
          type="button"
          onClick={handleRunScrapers}
          disabled={runLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 shadow-sm hover:bg-amber-100 disabled:opacity-50"
          aria-label="Uruchom scrapery (pobierz nowe oferty z źródeł)"
        >
          {runLoading ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
              Uruchamiam…
            </>
          ) : (
            <>
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Uruchom scrapery
            </>
          )}
        </button>
      </div>
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
