import { NextResponse } from "next/server";

/**
 * GET /api/debug-env – pokazuje, które zmienne Supabase widzi serwer (bez wartości).
 * Użyj na Vercelu, żeby sprawdzić, czy env vars dochodzą. Po sprawdzeniu możesz usunąć ten plik.
 */
export async function GET() {
  const url1 = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const url2 = process.env.NEXT_SUPABASE_URL?.trim();
  const url3 = process.env.SUPABASE_URL?.trim();
  const supabaseUrl = url1 || url2 || url3;

  const out = {
    supabaseUrlSource: url1
      ? "NEXT_PUBLIC_SUPABASE_URL"
      : url2
        ? "NEXT_SUPABASE_URL"
        : url3
          ? "SUPABASE_URL"
          : "none",
    supabaseUrlLength: supabaseUrl ? supabaseUrl.length : 0,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
      ? "ok"
      : "missing",
    onVercel: !!process.env.VERCEL,
  };

  return NextResponse.json(out);
}
