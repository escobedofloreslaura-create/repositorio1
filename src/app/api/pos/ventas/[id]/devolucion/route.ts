import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";
import { registrarMovimientoInventario } from "@/lib/pos/kardex";

// Devolución parcial: permite devolver un solo artículo de una venta previa.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesionPos();
    const { id } = await params;
    const { detalleVentaId, cantidad, motivo } = await req.json();

    const cantidadNum = Number(cantidad);
    if (!cantidadNum || cantidadNum <= 0) {
      return NextResponse.json({ ok: false, error: "La cantidad a devolver debe ser mayor a cero" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const venta = await tx.posVenta.findUnique({ where: { id }, include: { turno: true, pagos: true } });
      if (!venta) throw new Error("NO_ENCONTRADA");
      if (venta.estado !== "COMPLETADA") throw new Error("NO_COMPLETADA");
      if (venta.turno.estado !== "ABIERTO") throw new Error("TURNO_CERRADO");

      const detalle = await tx.posDetalleVenta.findUnique({ where: { id: detalleVentaId } });
      if (!detalle || detalle.ventaId !== id) throw new Error("DETALLE_NO_ENCONTRADO");

      const disponible = detalle.cantidad - detalle.cantidadDevuelta;
      if (cantidadNum > disponible) throw new Error("CANTIDAD_EXCEDE");

      const monto = cantidadNum * detalle.precioUnitario;

      await tx.posDetalleVenta.update({
        where: { id: detalleVentaId },
        data: { cantidadDevuelta: { increment: cantidadNum } },
      });

      if (detalle.productoId) {
        await registrarMovimientoInventario(tx, {
          productoId: detalle.productoId,
          tipo: "DEVOLUCION",
          delta: cantidadNum,
          detalle: `Devolución parcial de venta #${venta.folio}`,
          usuarioId: sesion.id,
          ventaId: venta.id,
        });
      }

      await tx.posDevolucion.create({
        data: {
          ventaId: venta.id,
          detalleVentaId,
          cantidad: cantidadNum,
          monto,
          motivo: motivo || null,
          usuarioId: sesion.id,
        },
      });

      const pagoCredito = venta.pagos.find((p) => p.forma === "CREDITO");
      if (pagoCredito && venta.clienteId) {
        await tx.posCliente.update({
          where: { id: venta.clienteId },
          data: { saldoActual: { decrement: monto } },
        });
      } else {
        const pagoEfectivo = venta.pagos.find((p) => p.forma === "EFECTIVO");
        const tipo = pagoEfectivo ? "VENTA_EFECTIVO" : venta.pagos.some((p) => p.forma === "TARJETA") ? "VENTA_TARJETA" : "VENTA_TRANSFERENCIA";
        await tx.posMovimientoCaja.create({
          data: {
            turnoId: venta.turnoId,
            tipo,
            monto: -monto,
            concepto: `Devolución parcial de venta #${venta.folio}${motivo ? `: ${motivo}` : ""}`,
            usuarioId: sesion.id,
            ventaId: venta.id,
          },
        });
      }
    });

    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    const mensajes: Record<string, [string, number]> = {
      NO_ENCONTRADA: ["Venta no encontrada", 404],
      NO_COMPLETADA: ["Solo se pueden devolver artículos de ventas completadas", 409],
      TURNO_CERRADO: ["No se puede devolver: el corte de caja de ese turno ya fue realizado", 409],
      DETALLE_NO_ENCONTRADO: ["Artículo no encontrado en esta venta", 404],
      CANTIDAD_EXCEDE: ["La cantidad a devolver excede lo disponible", 409],
    };
    if (e instanceof Error && mensajes[e.message]) {
      const [error, status] = mensajes[e.message];
      return NextResponse.json({ ok: false, error }, { status });
    }
    return respuestaError(e, "Error al procesar la devolución");
  }
}
