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

const RUTAS_POS_PUBLICAS = ["/pos/login", "/api/pos/auth/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Módulo POS (Vinos y Licores) — independiente del CRM ──────────────────
  if (pathname.startsWith("/pos") || pathname.startsWith("/api/pos")) {
    const esPublicaPos = RUTAS_POS_PUBLICAS.some((r) => pathname.startsWith(r));
    if (esPublicaPos) return NextResponse.next();

    const tokenPos = request.cookies.get("pos_session")?.value;
    if (!tokenPos) {
      return NextResponse.redirect(new URL("/pos/login", request.url));
    }
    return NextResponse.next();
  }

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
