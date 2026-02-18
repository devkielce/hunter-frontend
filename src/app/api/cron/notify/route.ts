import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { Resend } from "resend";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("notified", false)
    .eq("status", "new")
    .order("created_at", { ascending: false });

  const { data: alertRules } = await supabase
    .from("alert_rules")
    .select("email");

  const emails = (alertRules ?? [])
    .map((r: { email?: string }) => r?.email)
    .filter((e): e is string => typeof e === "string" && e.length > 0);

  if (listings?.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "Brak nowych ofert do wysłania",
      sent: 0,
    });
  }

  if (emails.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "Brak adresów w alert_rules",
      sent: 0,
    });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.DIGEST_FROM_EMAIL ?? "Hunter <onboarding@resend.dev>";
  if (!resendKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 500 }
    );
  }

  const resend = new Resend(resendKey);

  const formatPrice = (pricePln: number | null) => {
    if (pricePln == null) return "Do ustalenia";
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 0,
    }).format(pricePln / 100);
  };

  const rows = (listings ?? []).map(
    (l: Record<string, unknown>) => `
    <tr>
      <td style="padding:8px;border:1px solid #eee;">${String(l.source ?? "")}</td>
      <td style="padding:8px;border:1px solid #eee;"><a href="${String(l.source_url ?? "#")}">${String(l.title ?? "").slice(0, 60)}…</a></td>
      <td style="padding:8px;border:1px solid #eee;">${formatPrice(l.price_pln != null ? Number(l.price_pln) : null)}</td>
      <td style="padding:8px;border:1px solid #eee;">${String(l.city ?? "—")}</td>
    </tr>`
  );

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Hunter – nowe oferty</title>
</head>
<body style="font-family:sans-serif;max-width:720px;margin:0 auto;padding:20px;">
  <h1>Hunter – nowe okazje nieruchomościowe</h1>
  <p>Liczba nowych ofert: <strong>${listings?.length ?? 0}</strong></p>
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr>
        <th style="padding:8px;border:1px solid #eee;text-align:left;">Źródło</th>
        <th style="padding:8px;border:1px solid #eee;text-align:left;">Tytuł</th>
        <th style="padding:8px;border:1px solid #eee;text-align:left;">Cena</th>
        <th style="padding:8px;border:1px solid #eee;text-align:left;">Miasto</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join("")}
    </tbody>
  </table>
  <p style="margin-top:24px;color:#666;font-size:14px;">
    Ten mail został wysłany przez Hunter (digest raz dziennie).
  </p>
</body>
</html>`;

  let sent = 0;
  for (const to of emails) {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Hunter – ${listings?.length ?? 0} nowych ofert nieruchomościowych`,
      html,
    });
    if (!error) sent++;
  }

  const ids = (listings ?? []).map((l: { id: string }) => l.id);
  if (ids.length > 0) {
    await supabase
      .from("listings")
      .update({ notified: true })
      .in("id", ids);
  }

  return NextResponse.json({
    ok: true,
    listingsCount: listings?.length ?? 0,
    emailsSent: sent,
    recipients: emails.length,
  });
}
