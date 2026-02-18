import { NextResponse } from "next/server";

/**
 * Proxy do hunter-backend POST /api/run (on-demand scrape).
 * Wywołanie z frontendu → ten route → backend z X-Run-Secret.
 */
export const maxDuration = 120;

export async function POST() {
  const raw = process.env.BACKEND_URL;
  const base = raw?.replace(/\/$/, "");
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/b9b1c305-6a02-48ec-b43d-f18838826706',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/run/route.ts:POST',message:'BACKEND_URL check',data:{hasRaw:typeof raw=== 'string',rawLength:typeof raw=== 'string'?raw.length:0,hasBase:!!base},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  if (!base) {
    return NextResponse.json(
      { ok: true, configured: false, message: "BACKEND_URL nie ustawiony – ustaw w zmiennych środowiskowych, aby odświeżać oferty z backendu." },
      { status: 200 }
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
