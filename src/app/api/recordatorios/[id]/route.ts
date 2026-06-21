import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const existente = await prisma.recordatorio.findFirst({
      where: { id, usuarioId: sesion.id },
    });

    if (!existente) return NextResponse.json({ ok: false, error: "Recordatorio no encontrado" }, { status: 404 });

    const { completado, pospuesto, texto, fecha } = body;

    let nuevaFecha = existente.fecha;
    if (pospuesto === true) {
      nuevaFecha = new Date(existente.fecha.getTime() + 24 * 60 * 60 * 1000);
    } else if (fecha) {
      nuevaFecha = new Date(fecha);
    }

    const recordatorio = await prisma.recordatorio.update({
      where: { id },
      data: {
        ...(completado !== undefined ? { completado } : {}),
        ...(pospuesto !== undefined ? { pospuesto } : {}),
        ...(texto ? { texto } : {}),
        fecha: nuevaFecha,
      },
    });

    return NextResponse.json({ ok: true, data: recordatorio });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al actualizar recordatorio" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { id } = await params;

    const existente = await prisma.recordatorio.findFirst({ where: { id, usuarioId: sesion.id } });
    if (!existente) return NextResponse.json({ ok: false, error: "Recordatorio no encontrado" }, { status: 404 });

    await prisma.recordatorio.delete({ where: { id } });

    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al eliminar recordatorio" }, { status: 500 });
  }
}
