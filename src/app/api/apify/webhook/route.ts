/**
 * Webhook Apify (Facebook) – ZAPAS.
 * Główna obsługa: hunter-backend POST /webhook/apify.
 * W Apify ustaw URL na backend (https://<host>/webhook/apify). Ten endpoint zostawiony na wypadek awarii backendu.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const SALE_KEYWORDS = [
  "sprzedaż",
  "sprzedam",
  "do sprzedania",
  "cena",
  "zł",
  "pln",
  "licytacja",
  "nieruchomość",
  "mieszkanie",
  "dom",
  "działka",
];

function normalizeApifyItem(item: Record<string, unknown>) {
  const title = [item.title, item.text, item.message]
    .filter(Boolean)
    .map(String)
    .join(" ")
    .trim() || "Bez tytułu";
  const sourceUrl =
    typeof item.postUrl === "string"
      ? item.postUrl
      : typeof item.url === "string"
        ? item.url
        : "";
  const images: string[] = [];
  if (Array.isArray(item.images)) {
    item.images.forEach((u) => typeof u === "string" && images.push(u));
  }
  if (typeof item.image === "string") images.push(item.image);

  return {
    title,
    source_url: sourceUrl,
    source: "facebook",
    description: title,
    price_pln: null as number | null,
    city: null as string | null,
    location: null as string | null,
    images,
  };
}

function matchesSaleKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return SALE_KEYWORDS.some((k) => lower.includes(k));
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-apify-webhook-secret");
  const expected = process.env.APIFY_WEBHOOK_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    eventType?: string;
    datasetId?: string;
    resource?: { id?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body?.eventType && body.eventType !== "ACTOR.RUN.SUCCEEDED") {
    return NextResponse.json({ ok: true, skipped: "eventType !== ACTOR.RUN.SUCCEEDED" });
  }

  const datasetId = body?.datasetId ?? body?.resource?.id;
  if (!datasetId) {
    return NextResponse.json(
      { error: "Missing datasetId" },
      { status: 400 }
    );
  }

  const token = process.env.APIFY_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "APIFY_TOKEN not configured" },
      { status: 500 }
    );
  }

  const url = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Apify dataset fetch failed", res.status, await res.text());
    return NextResponse.json(
      { error: "Failed to fetch dataset" },
      { status: 502 }
    );
  }

  const rawItems = (await res.json()) as Record<string, unknown>[];
  const toUpsert = rawItems
    .filter((item) => {
      const text = [item.title, item.text, item.message]
        .filter(Boolean)
        .map(String)
        .join(" ");
      return text && matchesSaleKeywords(text);
    })
    .map(normalizeApifyItem);

  const supabase = createServerClient();
  let inserted = 0;
  let updated = 0;

  for (const row of toUpsert) {
    if (!row.source_url) continue;
    const { data: existing } = await supabase
      .from("listings")
      .select("id")
      .eq("source_url", row.source_url)
      .eq("source", "facebook")
      .maybeSingle();

    const record = {
      ...row,
      status: "new",
      notified: false,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase
        .from("listings")
        .update(record)
        .eq("id", existing.id);
      if (!error) updated++;
    } else {
      const { error } = await supabase.from("listings").insert({
        ...record,
        created_at: new Date().toISOString(),
      });
      if (!error) inserted++;
    }
  }

  return NextResponse.json({
    ok: true,
    total: toUpsert.length,
    inserted,
    updated,
  });
}
