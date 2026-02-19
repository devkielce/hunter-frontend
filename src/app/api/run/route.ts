import { NextResponse } from "next/server";

/**
 * Proxy do hunter-backend POST /api/run (on-demand scrape).
 * Env: BACKEND_URL (required), HUNTER_RUN_SECRET (optional, sent as X-Run-Secret).
 */
export const maxDuration = 120;

export async function POST() {
  const raw = process.env.BACKEND_URL;
  const base = raw?.replace(/\/$/, "");

  if (!base) {
    return NextResponse.json(
      {
        ok: true,
        configured: false,
        message:
          "BACKEND_URL nie ustawiony – ustaw w zmiennych środowiskowych, aby odświeżać oferty z backendu.",
      },
      { status: 200 }
    );
  }

  const secret = process.env.HUNTER_RUN_SECRET;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers["X-Run-Secret"] = secret;
  }

  const url = `${base}/api/run`;
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/run] fetch failed:", message);
    return NextResponse.json(
      { ok: false, error: `Backend unreachable: ${message}` },
      { status: 502 }
    );
  }

  let data: Record<string, unknown>;
  try {
    const text = await res.text();
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    console.error("[POST /api/run] backend response not JSON, status:", res.status);
    return NextResponse.json(
      { ok: false, error: "Backend returned non-JSON response" },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const errMsg = (data.error as string) ?? res.statusText;
    console.error("[POST /api/run] backend error:", res.status, errMsg);
    return NextResponse.json(
      { ok: false, error: errMsg },
      { status: res.status >= 500 ? 502 : res.status }
    );
  }

  return NextResponse.json(data);
}
