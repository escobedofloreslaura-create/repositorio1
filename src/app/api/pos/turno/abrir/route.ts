import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

// Registro del fondo inicial diario de caja para dar cambio.
export async function POST(req: NextRequest) {
  try {
    const sesion = await requerirSesionPos();
    const { fondoInicial } = await req.json();

    const abierto = await prisma.posTurno.findFirst({ where: { usuarioId: sesion.id, estado: "ABIERTO" } });
    if (abierto) {
      return NextResponse.json({ ok: false, error: "Ya tienes una caja abierta" }, { status: 409 });
    }

    const monto = Number(fondoInicial) || 0;

    const turno = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.posTurno.create({
        data: { usuarioId: sesion.id, fondoInicial: monto },
      });
      await tx.posMovimientoCaja.create({
        data: {
          turnoId: nuevo.id,
          tipo: "FONDO_INICIAL",
          monto,
          concepto: "Fondo inicial de caja",
          usuarioId: sesion.id,
        },
      });
      return nuevo;
    });

    return NextResponse.json({ ok: true, data: turno });
  } catch (e) {
    return respuestaError(e, "Error al abrir la caja");
  }
}
