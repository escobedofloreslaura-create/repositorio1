import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";

export async function GET() {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    return NextResponse.json({ ok: true, data: sesion });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
