import type { Prisma } from "@/generated/prisma/client";
import type { TIPOS_MOVIMIENTO_INVENTARIO } from "./constantes";

type Tx = Prisma.TransactionClient;
type TipoMovimientoInventario = (typeof TIPOS_MOVIMIENTO_INVENTARIO)[number];

/**
 * Aplica un movimiento de inventario dentro de una transacción: ajusta la
 * existencia del producto y deja el registro de kardex (entradas/salidas con
 * existencia antes/después, hora y usuario que ejecutó la acción).
 *
 * `delta` es el cambio con signo: positivo suma existencia (ENTRADA,
 * DEVOLUCION, CANCELACION, o un AJUSTE hacia arriba), negativo la resta
 * (SALIDA, VENTA, o un AJUSTE hacia abajo).
 *
 * La resta se hace con un UPDATE condicionado (`existencia >= magnitud`) en
 * vez de leer-y-escribir el valor absoluto, para que dos ventas concurrentes
 * del mismo producto no puedan vender la misma última pieza dos veces.
 */
export async function registrarMovimientoInventario(
  tx: Tx,
  params: {
    productoId: string;
    tipo: TipoMovimientoInventario;
    delta: number;
    detalle?: string;
    usuarioId: string;
    ventaId?: string;
  }
) {
  const { productoId, tipo, delta, detalle, usuarioId, ventaId } = params;
  const magnitud = Math.abs(delta);

  if (delta < 0) {
    const resultado = await tx.posProducto.updateMany({
      where: { id: productoId, existencia: { gte: magnitud } },
      data: { existencia: { decrement: magnitud } },
    });
    if (resultado.count === 0) {
      const producto = await tx.posProducto.findUnique({ where: { id: productoId } });
      throw new Error(`STOCK_INSUFICIENTE:${producto?.nombre ?? productoId}`);
    }
  } else if (delta > 0) {
    await tx.posProducto.update({ where: { id: productoId }, data: { existencia: { increment: magnitud } } });
  }

  const productoActualizado = await tx.posProducto.findUniqueOrThrow({ where: { id: productoId } });
  const existenciaNueva = productoActualizado.existencia;
  const existenciaAnterior = existenciaNueva - delta;

  await tx.posMovimientoInventario.create({
    data: {
      productoId,
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
