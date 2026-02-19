import { NextResponse } from "next/server";

/**
 * Proxy to hunter-backend POST /api/run (Railway).
 * Env: BACKEND_URL (required), HUNTER_RUN_SECRET (sent as X-Run-Secret).
 */
export const maxDuration = 120;

export async function POST() {
  const BACKEND_URL = process.env.BACKEND_URL;

  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "BACKEND_URL not configured" },
      { status: 500 }
    );
  }

  const secret = process.env.HUNTER_RUN_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "HUNTER_RUN_SECRET not configured. Set it in Vercel → Settings → Environment Variables (same value as APIFY_WEBHOOK_SECRET on Railway), then redeploy." },
      { status: 500 }
    );
  }

  const base = BACKEND_URL.replace(/\/$/, "").trim();
  const withScheme =
    base.startsWith("http://") || base.startsWith("https://")
      ? base
      : `https://${base}`;
  const url = `${withScheme}/api/run`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Run-Secret": secret,
  };

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
      return NextResponse.json(
        { error: "Backend returned invalid JSON" },
        { status: 502 }
      );
    }
    if (res.status === 401) {
      const msg = (data.error as string) || "Unauthorized";
      return NextResponse.json(
        { ...data, error: `${msg} – Set HUNTER_RUN_SECRET on Vercel to the same value as APIFY_WEBHOOK_SECRET on Railway and redeploy.` },
        { status: 401 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: "Backend request failed" },
      { status: 502 }
    );
  }
}
