import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ ok: true, data: { clientes: [], citas: [], pagos: [] } });
    }

    const vendedorFilter = sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {};

    const [clientes, citas, pagos] = await Promise.all([
      prisma.cliente.findMany({
        where: {
          eliminadoEn: null,
          ...vendedorFilter,
          OR: [
            { nombre: { contains: q } },
            { telefono: { contains: q } },
            { correo: { contains: q } },
            { empresaNombre: { contains: q } },
          ],
        },
        take: 5,
        select: { id: true, nombre: true, telefono: true, correo: true, etapa: true, estado: true, empresaNombre: true },
      }),
      prisma.cita.findMany({
        where: {
          eliminadoEn: null,
          ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}),
          OR: [
            { notas: { contains: q } },
            { nombreProspecto: { contains: q } },
          ],
        },
        take: 5,
        include: { cliente: { select: { id: true, nombre: true } } },
      }),
      prisma.pago.findMany({
        where: {
          eliminadoEn: null,
          concepto: { contains: q },
          ...(sesion.rol === "VENDEDOR" ? { cliente: { vendedorId: sesion.id, eliminadoEn: null } } : {}),
        },
        take: 5,
        include: { cliente: { select: { id: true, nombre: true } } },
      }),
    ]);

    return NextResponse.json({ ok: true, data: { clientes, citas, pagos } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error en búsqueda" }, { status: 500 });
  }
}
