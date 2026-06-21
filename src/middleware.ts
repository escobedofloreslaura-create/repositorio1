import { NextRequest, NextResponse } from "next/server";

const RUTAS_PUBLICAS = [
  "/login",
  "/landing",
  "/agenda/",
  "/api/auth/",
  "/api/leads",
  "/api/agenda/",
  "/_next/",
  "/favicon",
  "/manifest",
  "/og-image",
  "/apple-touch",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const esPublica = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r));
  if (esPublica) return NextResponse.next();

  const token = request.cookies.get("crm_session")?.value;
  if (!token && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
