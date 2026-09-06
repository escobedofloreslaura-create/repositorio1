import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";
import { registrarMovimientoInventario } from "@/lib/pos/kardex";
import { TIPO_VENTA_POR_FORMA, type FormaPago } from "@/lib/pos/constantes";

// Cancela una venta completa: reintegra el stock al inventario y descuenta
// el dinero pagado de la caja del turno correspondiente.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesionPos();
    const { id } = await params;
    const { motivo } = await req.json().catch(() => ({ motivo: undefined }));

    await prisma.$transaction(async (tx) => {
      const venta = await tx.posVenta.findUnique({
        where: { id },
        include: { detalles: true, pagos: true, devoluciones: true, turno: true },
      });
      if (!venta) throw new Error("NO_ENCONTRADA");
      if (venta.estado === "CANCELADA") throw new Error("YA_CANCELADA");
      if (venta.devoluciones.length > 0) throw new Error("TIENE_DEVOLUCIONES");
      if (venta.turno.estado !== "ABIERTO") throw new Error("TURNO_CERRADO");

      for (const detalle of venta.detalles) {
        if (detalle.productoId) {
          await registrarMovimientoInventario(tx, {
            productoId: detalle.productoId,
            tipo: "CANCELACION",
            delta: detalle.cantidad,
            detalle: `Cancelación de venta #${venta.folio}`,
            usuarioId: sesion.id,
            ventaId: venta.id,
          });
        }
      }

      for (const pago of venta.pagos) {
        const forma = pago.forma as FormaPago;
        if (forma === "CREDITO" && venta.clienteId) {
          await tx.posCliente.update({
            where: { id: venta.clienteId },
            data: { saldoActual: { decrement: pago.monto } },
          });
        } else if (TIPO_VENTA_POR_FORMA[forma]) {
          // Se registra en el mismo rubro (efectivo/tarjeta/transferencia) con
          // signo negativo para que el corte de caja lo neteé correctamente.
          await tx.posMovimientoCaja.create({
            data: {
              turnoId: venta.turnoId,
              tipo: TIPO_VENTA_POR_FORMA[forma]!,
              monto: -pago.monto,
              concepto: `Cancelación de venta #${venta.folio}${motivo ? `: ${motivo}` : ""}`,
              usuarioId: sesion.id,
              ventaId: venta.id,
              clienteId: venta.clienteId,
            },
          });
        }
      }

      await tx.posVenta.update({
        where: { id },
        data: { estado: "CANCELADA", canceladaEn: new Date(), notas: motivo ? `Cancelada: ${motivo}` : venta.notas },
      });
    });

    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    if (e instanceof Error && e.message === "NO_ENCONTRADA") {
      return NextResponse.json({ ok: false, error: "Venta no encontrada" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "YA_CANCELADA") {
      return NextResponse.json({ ok: false, error: "Esta venta ya fue cancelada" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "TIENE_DEVOLUCIONES") {
      return NextResponse.json({ ok: false, error: "Esta venta ya tiene devoluciones parciales; no puede cancelarse por completo" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "TURNO_CERRADO") {
      return NextResponse.json({ ok: false, error: "No se puede cancelar: el corte de caja de ese turno ya fue realizado" }, { status: 409 });
    }
    return respuestaError(e, "Error al cancelar la venta");
  }
}
