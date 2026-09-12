import type { Prisma } from "@/generated/prisma/client";
import type { TIPOS_MOVIMIENTO_INVENTARIO } from "./constantes";

type Tx = Prisma.TransactionClient;
type TipoMovimientoInventario = (typeof TIPOS_MOVIMIENTO_INVENTARIO)[number];

/**
 * Aplica un movimiento de inventario dentro de una transacción: ajusta la
 * existencia del producto EN UNA SUCURSAL (PosExistencia) y deja el registro
 * de kardex (entradas/salidas con existencia antes/después, hora y usuario
 * que ejecutó la acción).
 *
 * `delta` es el cambio con signo: positivo suma existencia (ENTRADA,
 * DEVOLUCION, CANCELACION, TRASPASO_ENTRADA, o un AJUSTE hacia arriba),
 * negativo la resta (SALIDA, VENTA, TRASPASO_SALIDA, o un AJUSTE hacia abajo).
 *
 * La resta se hace con un UPDATE condicionado (`existencia >= magnitud`) en
 * vez de leer-y-escribir el valor absoluto, para que dos ventas concurrentes
 * del mismo producto no puedan vender la misma última pieza dos veces.
 */
export async function registrarMovimientoInventario(
  tx: Tx,
  params: {
    productoId: string;
    sucursalId: string;
    tipo: TipoMovimientoInventario;
    delta: number;
    detalle?: string;
    usuarioId: string;
    ventaId?: string;
  }
) {
  const { productoId, sucursalId, tipo, delta, detalle, usuarioId, ventaId } = params;
  const magnitud = Math.abs(delta);

  await tx.posExistencia.upsert({
    where: { sucursalId_productoId: { sucursalId, productoId } },
    update: {},
    create: { sucursalId, productoId, existencia: 0 },
  });

  if (delta < 0) {
    const resultado = await tx.posExistencia.updateMany({
      where: { sucursalId, productoId, existencia: { gte: magnitud } },
      data: { existencia: { decrement: magnitud } },
    });
    if (resultado.count === 0) {
      const producto = await tx.posProducto.findUnique({ where: { id: productoId } });
      throw new Error(`STOCK_INSUFICIENTE:${producto?.nombre ?? productoId}`);
    }
  } else if (delta > 0) {
    await tx.posExistencia.update({
      where: { sucursalId_productoId: { sucursalId, productoId } },
      data: { existencia: { increment: magnitud } },
    });
  }

  const existenciaActualizada = await tx.posExistencia.findUniqueOrThrow({
    where: { sucursalId_productoId: { sucursalId, productoId } },
  });
  const existenciaNueva = existenciaActualizada.existencia;
  const existenciaAnterior = existenciaNueva - delta;

  await tx.posMovimientoInventario.create({
    data: {
      productoId,
      sucursalId,
      tipo,
      cantidad: magnitud,
      existenciaAnterior,
      existenciaNueva,
      detalle,
      usuarioId,
      ventaId,
    },
  });

  return existenciaNueva;
}
