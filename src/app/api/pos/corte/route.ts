import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, requerirSucursalActiva } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

// Histórico infinito de cortes de caja diarios.
export async function GET(req: NextRequest) {
  try {
    const sesion = await requerirSesionPos();
    const sucursalId = await requerirSucursalActiva(sesion);
    const { searchParams } = new URL(req.url);
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    const cortes = await prisma.posCorteCaja.findMany({
      where: {
        sucursalId,
        ...(desde || hasta
          ? {
              fecha: {
                ...(desde ? { gte: new Date(desde) } : {}),
                ...(hasta ? { lte: new Date(hasta) } : {}),
              },
            }
          : {}),
      },
      include: { usuario: { select: { nombre: true } } },
      orderBy: { fecha: "desc" },
    });

    // La ganancia (costo vs. venta) es información confidencial del negocio:
    // solo los administradores la ven. Un cajero solo ve el importe de venta.
    const data =
      sesion.rol === "ADMINISTRADOR"
        ? cortes
        : cortes.map(({ costoVentas: _costoVentas, gananciaReal: _gananciaReal, ...resto }) => resto);

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return respuestaError(e, "Error al obtener el histórico de cortes");
  }
}
