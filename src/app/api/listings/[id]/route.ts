import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

/** GET /api/listings/debug-created-at — returns created_at format (for comparing local vs Vercel). Remove after use. */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> | { id: string } }
) {
  // #region agent log
  const params = await (typeof ctx.params?.then === "function" ? ctx.params : Promise.resolve(ctx.params));
  const id = params?.id ?? "";
  fetch("http://127.0.0.1:7247/ingest/2f25b38f-b1a7-4d41-b3f9-9c5c122cfa60", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "api/listings/[id]/route.ts GET",
      message: "GET handler invoked",
      data: { id, isDebugId: id === "debug-created-at" },
      timestamp: Date.now(),
      hypothesisId: "H1-GET-invoked",
    }),
  }).catch(() => {});
  // #endregion
  if (id !== "debug-created-at") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Missing Supabase env vars", created_at_raw: null, created_at_normalized: null },
      { status: 200 }
    );
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message, created_at_raw: null, created_at_normalized: null },
      { status: 200 }
    );
  }
  const row = data as { created_at?: unknown } | null;
  const raw = row?.created_at;
  const normalized = raw != null ? String(raw).trim() : null;
  // #region agent log
  fetch("http://127.0.0.1:7247/ingest/2f25b38f-b1a7-4d41-b3f9-9c5c122cfa60", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "api/listings/[id]/route.ts GET",
      message: "GET returning JSON",
      data: { created_at_raw: raw, created_at_normalized: normalized },
      timestamp: Date.now(),
      hypothesisId: "H1-GET-response",
    }),
  }).catch(() => {});
  // #endregion
  return NextResponse.json({
    created_at_raw: raw,
    created_at_raw_type: typeof raw,
    created_at_normalized: normalized,
    hint: "Compare with local: http://localhost:3000/api/listings/debug-created-at",
  });
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { status?: string };
  try {
    body = await _req.json();
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowy JSON" },
      { status: 400 }
    );
  }
  const status = body?.status;
  if (!status || typeof status !== "string") {
    return NextResponse.json(
      { error: "Brak pola status" },
      { status: 400 }
    );
  }
  const allowed = ["new", "contacted", "viewed", "archived"];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: "Nieprawidłowy status" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("listings update error", error);
    return NextResponse.json({ error: "Błąd aktualizacji" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
