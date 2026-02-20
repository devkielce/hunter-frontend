"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // #region agent log
    console.error("[DashboardError] Caught error:", error?.message, error?.stack, { digest: error?.digest });
    fetch("http://127.0.0.1:7247/ingest/2f25b38f-b1a7-4d41-b3f9-9c5c122cfa60", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "dashboard/error.tsx",
        message: "Dashboard error boundary",
        data: { message: error?.message, name: error?.name, digest: error?.digest },
        timestamp: Date.now(),
        hypothesisId: "deploy-fail",
      }),
    }).catch(() => {});
    // #endregion
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4">
      <h2 className="text-lg font-semibold text-red-800 mb-2">Dashboard error</h2>
      <p className="text-sm text-neutral-700 font-mono mb-4 max-w-xl break-words">
        {error?.message ?? "Unknown error"}
      </p>
      {error?.digest && (
        <p className="text-xs text-neutral-500 mb-4">Digest: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-white text-sm font-medium"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
