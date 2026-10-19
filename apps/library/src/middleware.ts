import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidToken } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/login" || pathname === "/api/session") return NextResponse.next();

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = bearer ?? req.cookies.get(SESSION_COOKIE)?.value;
  if (isValidToken(token)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
