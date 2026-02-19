import { NextResponse } from "next/server";

/**
 * Proxy to hunter-backend POST /api/run (Railway).
 * Env: BACKEND_URL (required), HUNTER_RUN_SECRET (sent as X-Run-Secret; must match APIFY_WEBHOOK_SECRET on Railway).
 * Request body is forwarded (e.g. { days_back: 1 } for test runs).
 * Backend may return 202 Accepted (run in background) or 200 with results; both are forwarded.
 * If you add GET /api/run/status (or any other route that calls Railway), send X-Run-Secret on every request.
 */
export const maxDuration = 120;

export async function POST(request: Request) {
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

  // Required by Railway: every request to the backend must include X-Run-Secret (same value as APIFY_WEBHOOK_SECRET on Railway).
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Run-Secret": secret,
  };

  let body: Record<string, unknown> = {};
  try {
    const raw = await request.text();
    if (raw.trim()) body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // ignore invalid or empty body
  }

  // Abort before Vercel kills the function (Hobby 10s, Pro 60s). 50s leaves headroom.
  const backendTimeoutMs = 50_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), backendTimeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
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
    if (res.status === 500) {
      const msg = (data.error as string) || (data.message as string) || "Backend returned 500.";
      return NextResponse.json(
        { ...data, error: msg },
        { status: 500 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === "AbortError") {
      return NextResponse.json(
        {
          error:
            "Backend is taking too long (timeout). The run may still be in progress on Railway. Try again in a minute or check Railway logs.",
        },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Backend request failed" },
      { status: 502 }
    );
  }
}
