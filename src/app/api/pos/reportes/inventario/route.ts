import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

// Reporte general de inventario: piezas en existencia y comparación del
// valor de inventario a precio de costo vs. precio de venta.
export async function GET() {
  try {
    await requerirSesionPos();
    const productos = await prisma.posProducto.findMany({
      where: { activo: true },
      include: { departamento: true },
      orderBy: [{ departamento: { orden: "asc" } }, { nombre: "asc" }],
    });

    const filas = productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      departamento: p.departamento.nombre,
      unidad: p.unidad,
      existencia: p.existencia,
      existenciaMinima: p.existenciaMinima,
      bajaExistencia: p.existencia <= p.existenciaMinima,
      precioCosto: p.precioCosto,
      precioVenta: p.precioVenta,
      valorCosto: p.existencia * p.precioCosto,
      valorVenta: p.existencia * p.precioVenta,
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
