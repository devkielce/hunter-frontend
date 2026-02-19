import { NextResponse } from "next/server";

/**
 * Proxy do hunter-backend POST /api/run (Railway).
 * Frontend nie wywołuje Railway z przeglądarki – tylko ten route z secretem.
 * Env: BACKEND_URL (wymagany), HUNTER_RUN_SECRET (ten sam co APIFY_WEBHOOK_SECRET na Railway).
 */
export const maxDuration = 120;

export async function POST() {
  const BACKEND_URL = process.env.BACKEND_URL;
  const HUNTER_RUN_SECRET = process.env.HUNTER_RUN_SECRET;

  console.error("[POST /api/run] BACKEND_URL present:", !!BACKEND_URL, "HUNTER_RUN_SECRET present:", !!HUNTER_RUN_SECRET);

  if (!BACKEND_URL) {
    console.error("[POST /api/run] Returning 500: BACKEND_URL not configured.");
    return NextResponse.json(
      { error: "BACKEND_URL not configured" },
      { status: 500 }
    );
  }

  const base = BACKEND_URL.replace(/\/$/, "").trim();
  const withScheme = base.startsWith("http://") || base.startsWith("https://") ? base : `https://${base}`;
  const url = `${withScheme}/api/run`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (HUNTER_RUN_SECRET) {
    headers["X-Run-Secret"] = HUNTER_RUN_SECRET;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });
    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      console.error("[POST /api/run] Backend returned non-JSON, status:", res.status, "body length:", text.length);
      return NextResponse.json(
        { error: "Backend returned invalid JSON" },
        { status: 502 }
      );
    }
    console.error("[POST /api/run] Backend response status:", res.status);
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("[POST /api/run] Proxy fetch failed:", e);
    return NextResponse.json(
      { error: "Backend request failed" },
      { status: 502 }
    );
  }
}
