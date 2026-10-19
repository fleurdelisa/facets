import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  const next = String(form.get("next") ?? "/");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (!isValidToken(token)) {
    return NextResponse.redirect(new URL(`/login?error=1&next=${encodeURIComponent(safeNext)}`, req.url), 303);
  }
  const res = NextResponse.redirect(new URL(safeNext, req.url), 303);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: (req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")) === "https",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
