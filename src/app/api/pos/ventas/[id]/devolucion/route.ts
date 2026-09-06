import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";
import { registrarMovimientoInventario } from "@/lib/pos/kardex";
import { TIPO_VENTA_POR_FORMA, type FormaPago } from "@/lib/pos/constantes";

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

      // El reembolso se reparte proporcionalmente entre las formas de pago
      // originales de la venta (una venta puede estar pagada con varios
      // métodos a la vez), en vez de cargarlo entero a un solo rubro —
      // así el corte de caja neteé correctamente cada forma de pago.
      if (venta.total > 0) {
        let restante = Math.round(monto * 100) / 100;
        for (const [i, pago] of venta.pagos.entries()) {
          const esUltimo = i === venta.pagos.length - 1;
          const proporcion = pago.monto / venta.total;
          const montoPago = esUltimo ? restante : Math.min(restante, Math.round(monto * proporcion * 100) / 100);
          restante = Math.round((restante - montoPago) * 100) / 100;
          if (montoPago <= 0) continue;

          const forma = pago.forma as FormaPago;
          if (forma === "CREDITO" && venta.clienteId) {
            await tx.posCliente.update({
              where: { id: venta.clienteId },
              data: { saldoActual: { decrement: montoPago } },
            });
            continue;
          }

          const tipo = TIPO_VENTA_POR_FORMA[forma];
          if (!tipo) continue;
          await tx.posMovimientoCaja.create({
            data: {
              turnoId: venta.turnoId,
              tipo,
              monto: -montoPago,
              concepto: `Devolución parcial de venta #${venta.folio}${motivo ? `: ${motivo}` : ""}`,
              usuarioId: sesion.id,
              ventaId: venta.id,
              clienteId: venta.clienteId,
            },
          });
        }
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
