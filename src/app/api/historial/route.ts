import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get("clienteId");
    const take = parseInt(searchParams.get("take") ?? "50");
    const skip = parseInt(searchParams.get("skip") ?? "0");

    if (!clienteId) {
      return NextResponse.json({ ok: false, error: "clienteId es requerido" }, { status: 400 });
    }

    // Verify access
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        eliminadoEn: null,
        ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}),
      },
    });

    if (!cliente) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });

    const historial = await prisma.historialAccion.findMany({
      where: { clienteId },
      orderBy: { fecha: "desc" },
      skip,
      take,
      include: {
        usuario: { select: { id: true, nombre: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ ok: true, data: historial });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener historial" }, { status: 500 });
  }
}
