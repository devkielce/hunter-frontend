import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

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
