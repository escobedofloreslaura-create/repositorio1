import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, requerirSucursalActiva } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

// Kardex / auditoría: historial de movimientos de inventario con detalle,
// hora y usuario que ejecutó la acción.
export async function GET(req: NextRequest) {
  try {
    const sesion = await requerirSesionPos();
    // Igual que el reporte de inventario, el kardex es información
    // confidencial del negocio: solo para administradores.
    if (sesion.rol !== "ADMINISTRADOR") {
      return NextResponse.json({ ok: false, error: "No tienes permiso para ver el kardex" }, { status: 403 });
    }
    const sucursalId = await requerirSucursalActiva(sesion);
    const { searchParams } = new URL(req.url);
    const productoId = searchParams.get("productoId");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const movimientos = await prisma.posMovimientoInventario.findMany({
      where: {
        sucursalId,
        ...(productoId ? { productoId } : {}),
        ...(desde || hasta
          ? {
              creadoEn: {
                ...(desde ? { gte: new Date(desde) } : {}),
                ...(hasta ? { lte: new Date(hasta) } : {}),
              },
            }
          : {}),
      },
      include: {
        producto: { select: { nombre: true, codigoBarras: true } },
        usuario: { select: { nombre: true } },
      },
      orderBy: { creadoEn: "desc" },
      take: 500,
    });

    return NextResponse.json({ ok: true, data: movimientos });
  } catch (e) {
    return respuestaError(e, "Error al obtener el kardex");
  }
}
