import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

const TIPOS_PERMITIDOS = ["SALIDA", "PAGO_PROVEEDOR", "ENTRADA_MANUAL"];

// Salidas de dinero (retiros) y entradas manuales de efectivo a la caja.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesionPos();
    const { id } = await params;
    const { tipo, monto, concepto } = await req.json();

    if (!TIPOS_PERMITIDOS.includes(tipo)) {
      return NextResponse.json({ ok: false, error: "Tipo de movimiento inválido" }, { status: 400 });
    }
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      return NextResponse.json({ ok: false, error: "El monto debe ser mayor a cero" }, { status: 400 });
    }
    if (!concepto || !String(concepto).trim()) {
      return NextResponse.json({ ok: false, error: "El concepto es requerido" }, { status: 400 });
    }

    const turno = await prisma.posTurno.findUnique({ where: { id } });
    if (!turno || turno.estado !== "ABIERTO") {
      return NextResponse.json({ ok: false, error: "La caja no está abierta" }, { status: 409 });
    }

    const movimiento = await prisma.posMovimientoCaja.create({
      data: {
        turnoId: id,
        tipo,
        monto: montoNum,
        concepto: String(concepto).trim(),
        usuarioId: sesion.id,
      },
    });

    return NextResponse.json({ ok: true, data: movimiento });
  } catch (e) {
    return respuestaError(e, "Error al registrar el movimiento de caja");
  }
}
