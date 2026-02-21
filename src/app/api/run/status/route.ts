import { NextResponse } from "next/server";

/**
 * Proxy to hunter-backend GET /api/run/status (Railway).
 * Env: BACKEND_URL (required), HUNTER_RUN_SECRET (sent as X-Run-Secret).
 * Used after POST /api/run returns 202 to poll until status is completed or error.
 */
export async function GET() {
  const BACKEND_URL = process.env.BACKEND_URL;

  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "BACKEND_URL not configured" },
      { status: 500 }
    );
  }

  const secret = process.env.HUNTER_RUN_SECRET?.trim();
  const base = BACKEND_URL.replace(/\/$/, "").trim();
  const withScheme =
    base.startsWith("http://") || base.startsWith("https://")
      ? base
      : `https://${base}`;
  const url = `${withScheme}/api/run/status`;

  const headers: HeadersInit = {};
  if (secret) headers["X-Run-Secret"] = secret;

  try {
    const res = await fetch(url, { method: "GET", headers });
    const text = await res.text();
    let data: Record<string, unknown>;
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      return NextResponse.json(
        { error: "Backend returned invalid JSON" },
        { status: 502 }
      );
    }
    if (res.status === 401) {
      const msg = (data.error as string) || "Unauthorized";
      return NextResponse.json(
        {
          ...data,
          error: `${msg} – Set HUNTER_RUN_SECRET on Vercel to the same value as APIFY_WEBHOOK_SECRET on Railway and redeploy.`,
        },
        { status: 401 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("Proxy GET /api/run/status failed:", e);
    return NextResponse.json(
      { error: "Backend request failed" },
      { status: 502 }
    );
  }
}
