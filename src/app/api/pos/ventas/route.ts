import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";
import { registrarMovimientoInventario } from "@/lib/pos/kardex";
import { siguienteFolioVenta } from "@/lib/pos/folio";
import { TIPO_VENTA_POR_FORMA } from "@/lib/pos/constantes";

interface ItemEntrada {
  productoId?: string;
  descripcion?: string;
  cantidad: number;
  precioUnitario: number;
  esMayoreo?: boolean;
}

interface PagoEntrada {
  forma: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "CREDITO";
  monto: number;
}

const TOLERANCIA = 0.01;

export async function GET(req: NextRequest) {
  try {
    await requerirSesionPos();
    const { searchParams } = new URL(req.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const turnoId = searchParams.get("turnoId");
    const estado = searchParams.get("estado");

    const ventas = await prisma.posVenta.findMany({
      where: {
        ...(turnoId ? { turnoId } : {}),
        ...(estado ? { estado } : {}),
        ...(desde || hasta
          ? {
              fecha: {
                ...(desde ? { gte: new Date(desde) } : {}),
                ...(hasta ? { lte: new Date(hasta) } : {}),
              },
            }
          : {}),
      },
      include: {
        detalles: true,
        pagos: true,
        cliente: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: "desc" },
      take: 200,
    });

    return NextResponse.json({ ok: true, data: ventas });
  } catch (e) {
    return respuestaError(e, "Error al obtener ventas");
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await requerirSesionPos();
    const body = await req.json();
    const { turnoId, clienteId, notas } = body;
    const items: ItemEntrada[] = body.items ?? [];
    const pagos: PagoEntrada[] = body.pagos ?? [];

    if (!turnoId) return NextResponse.json({ ok: false, error: "Falta el turno de caja" }, { status: 400 });
    if (items.length === 0) return NextResponse.json({ ok: false, error: "El ticket no tiene artículos" }, { status: 400 });
    if (pagos.length === 0) return NextResponse.json({ ok: false, error: "Falta registrar la forma de pago" }, { status: 400 });

    for (const item of items) {
      if (!item.productoId && !item.descripcion?.trim()) {
        return NextResponse.json({ ok: false, error: "Un artículo provisional requiere descripción" }, { status: 400 });
      }
      if (!item.cantidad || item.cantidad <= 0) {
        return NextResponse.json({ ok: false, error: "La cantidad de un artículo debe ser mayor a cero" }, { status: 400 });
      }
    }

    const totalTicket = items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
    const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
    if (Math.abs(totalTicket - totalPagado) > TOLERANCIA) {
      return NextResponse.json({ ok: false, error: "El total pagado no coincide con el total del ticket" }, { status: 400 });
    }

    const montoCredito = pagos.filter((p) => p.forma === "CREDITO").reduce((a, p) => a + p.monto, 0);
    if (montoCredito > 0 && !clienteId) {
      return NextResponse.json({ ok: false, error: "Selecciona un cliente para la venta a crédito" }, { status: 400 });
    }

    const venta = await prisma.$transaction(async (tx) => {
      const turno = await tx.posTurno.findUnique({ where: { id: turnoId } });
      if (!turno || turno.estado !== "ABIERTO") throw new Error("CAJA_CERRADA");
      if (turno.usuarioId !== sesion.id && sesion.rol !== "ADMINISTRADOR") throw new Error("SIN_PERMISO");

      let cliente = null;
      if (montoCredito > 0 && clienteId) {
        cliente = await tx.posCliente.findUniqueOrThrow({ where: { id: clienteId } });
        const nuevoSaldo = cliente.saldoActual + montoCredito;
        if (nuevoSaldo > cliente.limiteCredito) throw new Error("LIMITE_CREDITO");
        await tx.posCliente.update({ where: { id: clienteId }, data: { saldoActual: nuevoSaldo } });
      }

      const folio = await siguienteFolioVenta(tx);

      const nuevaVenta = await tx.posVenta.create({
        data: {
          folio,
          turnoId,
          clienteId: clienteId || null,
          usuarioId: sesion.id,
          subtotal: totalTicket,
          total: totalTicket,
          notas: notas || null,
        },
      });

      for (const item of items) {
        let costoUnitario = 0;
        if (item.productoId) {
          const producto = await tx.posProducto.findUniqueOrThrow({ where: { id: item.productoId } });
          if (producto.existencia < item.cantidad) {
            throw new Error(`STOCK_INSUFICIENTE:${producto.nombre}`);
          }
          costoUnitario = producto.precioCosto;
          await registrarMovimientoInventario(tx, {
            productoId: item.productoId,
            tipo: "VENTA",
            delta: -item.cantidad,
            detalle: `Venta #${folio}`,
            usuarioId: sesion.id,
            ventaId: nuevaVenta.id,
          });
        }

        await tx.posDetalleVenta.create({
          data: {
            ventaId: nuevaVenta.id,
            productoId: item.productoId || null,
            descripcion: item.productoId ? "" : item.descripcion!.trim(),
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            costoUnitario,
            esMayoreo: !!item.esMayoreo,
            subtotal: item.cantidad * item.precioUnitario,
          },
        });
      }

      for (const pago of pagos) {
        await tx.posPagoVenta.create({
          data: { ventaId: nuevaVenta.id, forma: pago.forma, monto: pago.monto },
        });

        const tipoMovimiento = TIPO_VENTA_POR_FORMA[pago.forma];

        if (tipoMovimiento) {
          await tx.posMovimientoCaja.create({
            data: {
              turnoId,
              tipo: tipoMovimiento,
              monto: pago.monto,
              concepto: `Venta #${folio}`,
              usuarioId: sesion.id,
              ventaId: nuevaVenta.id,
              clienteId: clienteId || null,
            },
          });
        }
      }

      return tx.posVenta.findUniqueOrThrow({
        where: { id: nuevaVenta.id },
        include: { detalles: true, pagos: true, cliente: true },
      });
    });

    return NextResponse.json({ ok: true, data: venta });
  } catch (e) {
    if (e instanceof Error && e.message === "CAJA_CERRADA") {
      return NextResponse.json({ ok: false, error: "La caja de este turno ya está cerrada" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "SIN_PERMISO") {
      return NextResponse.json({ ok: false, error: "No puedes vender en la caja de otro cajero" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "LIMITE_CREDITO") {
      return NextResponse.json({ ok: false, error: "El cliente excede su límite de crédito" }, { status: 409 });
    }
    if (e instanceof Error && e.message.startsWith("STOCK_INSUFICIENTE:")) {
      return NextResponse.json({ ok: false, error: `Existencia insuficiente de "${e.message.split(":")[1]}"` }, { status: 409 });
    }
    return respuestaError(e, "Error al registrar la venta");
  }
}
