import { NextResponse } from "next/server";

/**
 * Proxy do hunter-backend POST /api/run (on-demand scrape).
 * Wywołanie z frontendu → ten route → backend z X-Run-Secret.
 */
export const maxDuration = 120;

export async function POST() {
  const base = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (!base) {
    return NextResponse.json(
      { ok: false, error: "BACKEND_URL not configured" },
      { status: 503 }
    );
  }

  const secret = process.env.RUN_SECRET ?? process.env.APIFY_WEBHOOK_SECRET;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers["X-Run-Secret"] = secret;
  }

  const res = await fetch(`${base}/api/run`, {
    method: "POST",
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: data.error ?? res.statusText },
      { status: res.status >= 500 ? 502 : res.status }
    );
  }

  return NextResponse.json(data);
}
