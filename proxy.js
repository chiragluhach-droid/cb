import { NextResponse } from "next/server";
import { COOKIE, verifySession } from "@/lib/session";

export async function proxy(req) {
  const s = await verifySession(req.cookies.get(COOKIE)?.value);
  const { pathname } = req.nextUrl;
  if (!s) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, req.url));
  if (pathname.startsWith("/admin") && s.role !== "admin") return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/checkout/:path*", "/start/:path*"] };
