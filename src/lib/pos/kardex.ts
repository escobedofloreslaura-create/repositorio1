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
  const producto = await tx.posProducto.findUniqueOrThrow({ where: { id: params.productoId } });
  const existenciaAnterior = producto.existencia;
  const existenciaNueva = existenciaAnterior + params.delta;

  await tx.posProducto.update({ where: { id: params.productoId }, data: { existencia: existenciaNueva } });

  await tx.posMovimientoInventario.create({
    data: {
      productoId: params.productoId,
      tipo: params.tipo,
      cantidad: Math.abs(params.delta),
      existenciaAnterior,
      existenciaNueva,
      detalle: params.detalle,
      usuarioId: params.usuarioId,
      ventaId: params.ventaId,
    },
  });

  return existenciaNueva;
}
