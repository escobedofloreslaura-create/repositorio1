import { NextResponse } from "next/server";

export function respuestaError(e: unknown, mensajeDefault: string) {
  if (e instanceof Error && e.message === "NO_AUTORIZADO") {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  if (e instanceof Error && e.message === "SOLO_ADMIN") {
    return NextResponse.json({ ok: false, error: "Solo un administrador puede realizar esta acción" }, { status: 403 });
  }
  if (e instanceof Error && e.message === "SOLO_ADMIN_GENERAL") {
    return NextResponse.json({ ok: false, error: "Solo el Administrador General puede realizar esta acción" }, { status: 403 });
  }
  if (e instanceof Error && e.message === "SIN_SUCURSAL") {
    return NextResponse.json({ ok: false, error: "No hay ninguna sucursal activa" }, { status: 409 });
  }
  if (e instanceof Error && e.message === "SIN_PERMISO") {
    return NextResponse.json({ ok: false, error: "No tienes permiso para realizar esta acción" }, { status: 403 });
  }
  console.error(e);
  return NextResponse.json({ ok: false, error: mensajeDefault }, { status: 500 });
}
