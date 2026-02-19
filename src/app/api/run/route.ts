import { NextResponse } from "next/server";

/**
 * Proxy do hunter-backend POST /api/run (Railway).
 * Env: BACKEND_URL (wymagany), HUNTER_RUN_SECRET (wysyłany jako X-Run-Secret).
 */
export const maxDuration = 120;

export async function POST() {
  const BACKEND_URL = process.env.BACKEND_URL;
  const HUNTER_RUN_SECRET = process.env.HUNTER_RUN_SECRET;

  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "BACKEND_URL not configured" },
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
  };
  if (HUNTER_RUN_SECRET?.trim()) {
    headers["X-Run-Secret"] = HUNTER_RUN_SECRET.trim();
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
      return NextResponse.json(
        { error: "Backend returned invalid JSON" },
        { status: 502 }
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
