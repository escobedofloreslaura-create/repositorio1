import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos } from "@/lib/pos/auth";

export async function GET() {
  try {
    await requerirSesionPos();
    const departamentos = await prisma.posDepartamento.findMany({ orderBy: { orden: "asc" } });
    return NextResponse.json({ ok: true, data: departamentos });
  } catch (e) {
    if (e instanceof Error && e.message === "NO_AUTORIZADO") {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener departamentos" }, { status: 500 });
  }
}
