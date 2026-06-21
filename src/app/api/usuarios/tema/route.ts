import { NextRequest, NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    const { tema } = await req.json();
    if (!["claro", "oscuro", "sistema"].includes(tema)) {
      return NextResponse.json({ ok: false, error: "Tema inválido" }, { status: 400 });
    }
    await prisma.usuario.update({ where: { id: sesion.id }, data: { temaPreferido: tema } });
    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al actualizar tema" }, { status: 500 });
  }
}
