import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirAdminPos, puedeOperarTurno } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

// Reasignar el turno abierto a otro usuario de la misma sucursal — por
// ejemplo, cuando el administrador que abrió la caja en la mañana necesita
// salir y un cajero se queda a cargo para hacer el corte al final del día.
// Solo un administrador (de la tienda o general) puede reasignar, y solo a
// alguien de la misma sucursal que el turno.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirAdminPos();
    const { id } = await params;
    const { usuarioId } = await req.json();

    if (!usuarioId) {
      return NextResponse.json({ ok: false, error: "Selecciona a quién reasignar la caja" }, { status: 400 });
    }

    const turno = await prisma.posTurno.findUnique({ where: { id } });
    if (!turno) return NextResponse.json({ ok: false, error: "Turno no encontrado" }, { status: 404 });
    if (turno.estado !== "ABIERTO") {
      return NextResponse.json({ ok: false, error: "Este turno ya fue cerrado" }, { status: 409 });
    }
    if (!puedeOperarTurno(sesion, turno)) {
      return NextResponse.json({ ok: false, error: "No puedes reasignar la caja de otra sucursal" }, { status: 403 });
    }

    const nuevoUsuario = await prisma.posUsuario.findUnique({ where: { id: usuarioId } });
    if (!nuevoUsuario || !nuevoUsuario.activo || nuevoUsuario.sucursalId !== turno.sucursalId) {
      return NextResponse.json({ ok: false, error: "El usuario debe pertenecer a la misma sucursal" }, { status: 400 });
    }

    const actualizado = await prisma.posTurno.update({
      where: { id },
      data: { usuarioId },
      include: { usuario: { select: { nombre: true } } },
    });

    return NextResponse.json({ ok: true, data: actualizado });
  } catch (e) {
    return respuestaError(e, "Error al reasignar la caja");
  }
}
