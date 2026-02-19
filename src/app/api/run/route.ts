import { NextResponse } from "next/server";

/**
 * Proxy do hunter-backend POST /api/run (Railway).
 * Frontend nie wywołuje Railway z przeglądarki – tylko ten route z secretem.
 * Env: BACKEND_URL (wymagany), HUNTER_RUN_SECRET (ten sam co APIFY_WEBHOOK_SECRET na Railway).
 */
export const maxDuration = 120;

const BACKEND_URL = process.env.BACKEND_URL;
const HUNTER_RUN_SECRET = process.env.HUNTER_RUN_SECRET;

export async function POST() {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "BACKEND_URL not configured" },
      { status: 500 }
    );
  }

  const url = `${BACKEND_URL.replace(/\/$/, "")}/api/run`;
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
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("Proxy /api/run failed:", e);
    return NextResponse.json(
      { error: "Backend request failed" },
      { status: 502 }
    );
  }
}
