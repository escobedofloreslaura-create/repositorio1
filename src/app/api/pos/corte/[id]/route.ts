import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, esAdminGeneral } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

const TIPOS_MOVIMIENTO_CON_CONCEPTO = ["SALIDA", "PAGO_PROVEEDOR", "ENTRADA_MANUAL"];

function detalleMovimientos(movimientos: { tipo: string; monto: number; concepto: string | null }[]) {
  return movimientos
    .filter((m) => TIPOS_MOVIMIENTO_CON_CONCEPTO.includes(m.tipo))
    .map((m) => ({ tipo: m.tipo, concepto: m.concepto ?? "", monto: m.monto }));
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesionPos();
    const { id } = await params;
    const corte = await prisma.posCorteCaja.findUnique({
      where: { id },
      include: {
        usuario: { select: { nombre: true } },
        turno: { include: { movimientos: { orderBy: { creadoEn: "asc" } }, ventas: true } },
      },
    });
    if (!corte) return NextResponse.json({ ok: false, error: "Corte no encontrado" }, { status: 404 });
    if (!esAdminGeneral(sesion) && corte.sucursalId !== sesion.sucursalId) {
      return NextResponse.json({ ok: false, error: "Corte no encontrado" }, { status: 404 });
    }

    // La ganancia (costo vs. venta) y el desglose por departamento son
    // información confidencial del negocio: solo los administradores la ven.
    // Un cajero solo ve el importe total de venta.
    const movimientosDetalle = detalleMovimientos(corte.turno.movimientos);

    if (sesion.rol !== "ADMINISTRADOR") {
      const { costoVentas: _costoVentas, gananciaReal: _gananciaReal, ...resto } = corte;
      return NextResponse.json({ ok: true, data: { ...resto, movimientosDetalle } });
    }

    const ventasDetalladas = await prisma.posVenta.findMany({
      where: { turnoId: corte.turnoId, estado: "COMPLETADA" },
      include: { detalles: { include: { producto: { include: { departamento: true } } } } },
    });
    const ventasPorDepartamentoMapa = new Map<string, number>();
    for (const venta of ventasDetalladas) {
      for (const detalle of venta.detalles) {
        const subtotalNeto = (detalle.cantidad - detalle.cantidadDevuelta) * detalle.precioUnitario;
        const nombreDepartamento = detalle.producto?.departamento.nombre ?? "Otros";
        ventasPorDepartamentoMapa.set(nombreDepartamento, (ventasPorDepartamentoMapa.get(nombreDepartamento) ?? 0) + subtotalNeto);
      }
    }
    const ventasPorDepartamento = Array.from(ventasPorDepartamentoMapa, ([departamento, total]) => ({ departamento, total })).sort(
      (a, b) => b.total - a.total
    );

    return NextResponse.json({ ok: true, data: { ...corte, ventasPorDepartamento, movimientosDetalle } });
  } catch (e) {
    return respuestaError(e, "Error al obtener el corte");
  }
}
