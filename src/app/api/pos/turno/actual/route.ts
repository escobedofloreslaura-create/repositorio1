import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

// Turno de caja abierto para el cajero en sesión (fondo inicial, salidas, etc.)
export async function GET() {
  try {
    const sesion = await requerirSesionPos();
    const turno = await prisma.posTurno.findFirst({
      where: { usuarioId: sesion.id, estado: "ABIERTO" },
      include: {
        movimientos: { orderBy: { creadoEn: "desc" } },
        usuario: { select: { nombre: true } },
      },
    });
    return NextResponse.json({ ok: true, data: turno });
  } catch (e) {
    return respuestaError(e, "Error al obtener el turno actual");
  }
}
