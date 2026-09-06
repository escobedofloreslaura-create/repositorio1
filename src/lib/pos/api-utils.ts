import { NextResponse } from "next/server";

export function respuestaError(e: unknown, mensajeDefault: string) {
  if (e instanceof Error && e.message === "NO_AUTORIZADO") {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  if (e instanceof Error && e.message === "SOLO_ADMIN") {
    return NextResponse.json({ ok: false, error: "Solo un administrador puede realizar esta acción" }, { status: 403 });
  }
  console.error(e);
  return NextResponse.json({ ok: false, error: mensajeDefault }, { status: 500 });
}
