import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, esAdminGeneral } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

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
    return NextResponse.json({ ok: true, data: corte });
  } catch (e) {
    return respuestaError(e, "Error al obtener el corte");
  }
}
