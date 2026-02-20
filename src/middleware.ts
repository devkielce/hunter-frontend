import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const showDebug =
    url.searchParams.get("debug") === "1" ||
    url.searchParams.get("debug") === "true";

  const requestHeaders = new Headers(request.headers);
  if (showDebug) {
    requestHeaders.set("x-debug-created-at", "1");
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: "/dashboard",
};
