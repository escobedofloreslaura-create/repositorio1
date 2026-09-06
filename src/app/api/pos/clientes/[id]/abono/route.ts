import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

// Cobro a un cliente de crédito: reduce su saldo pendiente y se refleja como
// entrada de "Cobro a Clientes" en el corte de caja del turno.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesionPos();
    const { id } = await params;
    const { monto, turnoId } = await req.json();

    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      return NextResponse.json({ ok: false, error: "El monto debe ser mayor a cero" }, { status: 400 });
    }
    if (!turnoId) {
      return NextResponse.json({ ok: false, error: "Falta el turno de caja" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const cliente = await tx.posCliente.findUniqueOrThrow({ where: { id } });
      const turno = await tx.posTurno.findUnique({ where: { id: turnoId } });
      if (!turno || turno.estado !== "ABIERTO") throw new Error("CAJA_CERRADA");

      await tx.posCliente.update({
        where: { id },
        data: { saldoActual: Math.max(0, cliente.saldoActual - montoNum) },
      });

      await tx.posMovimientoCaja.create({
        data: {
          turnoId,
          tipo: "COBRO_CLIENTE",
          monto: montoNum,
          concepto: `Abono de ${cliente.nombre}`,
          usuarioId: sesion.id,
          clienteId: id,
        },
      });
    });

    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    if (e instanceof Error && e.message === "CAJA_CERRADA") {
      return NextResponse.json({ ok: false, error: "La caja de este turno ya está cerrada" }, { status: 409 });
    }
    return respuestaError(e, "Error al registrar el abono");
  }
}
