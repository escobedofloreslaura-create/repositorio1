import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, requerirSucursalActiva } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

// Reporte general de inventario de la sucursal activa: piezas en existencia
// y comparación del valor de inventario a precio de costo vs. precio de venta.
export async function GET() {
  try {
    const sesion = await requerirSesionPos();
    const sucursalId = await requerirSucursalActiva(sesion);

    const existencias = await prisma.posExistencia.findMany({
      where: { sucursalId, producto: { activo: true } },
      include: { producto: { include: { departamento: true } } },
      orderBy: [{ producto: { departamento: { orden: "asc" } } }, { producto: { nombre: "asc" } }],
    });

    const filas = existencias.map((e) => ({
      id: e.producto.id,
      nombre: e.producto.nombre,
      departamento: e.producto.departamento.nombre,
      unidad: e.producto.unidad,
      existencia: e.existencia,
      existenciaMinima: e.existenciaMinima,
      bajaExistencia: e.existencia <= e.existenciaMinima,
      precioCosto: e.producto.precioCosto,
      precioVenta: e.producto.precioVenta,
      valorCosto: e.existencia * e.producto.precioCosto,
      valorVenta: e.existencia * e.producto.precioVenta,
    }));

    const totales = filas.reduce(
      (acc, f) => ({
        valorCosto: acc.valorCosto + f.valorCosto,
        valorVenta: acc.valorVenta + f.valorVenta,
        piezas: acc.piezas + f.existencia,
      }),
      { valorCosto: 0, valorVenta: 0, piezas: 0 }
    );

    return NextResponse.json({ ok: true, data: { filas, totales } });
  } catch (e) {
    return respuestaError(e, "Error al generar el reporte de inventario");
  }
}
