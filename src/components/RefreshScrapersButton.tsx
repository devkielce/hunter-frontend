"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshScrapersButton() {
  const router = useRouter();
  const [refetchLoading, setRefetchLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const handleRefetch = async () => {
    setRefetchLoading(true);
    setMessage(null);
    await router.refresh();
    setMessage({ type: "ok", text: "Lista odświeżona." });
    setRefetchLoading(false);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleRefetch}
        disabled={refetchLoading}
        className="hunter-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        aria-label="Odśwież listę ofert z bazy"
      >
        {refetchLoading ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
      {message && (
        <p
          className={`text-xs ${message.type === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          role="status"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
