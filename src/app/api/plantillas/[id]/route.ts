import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const { id } = await params;

    const existente = await prisma.plantillaMensaje.findUnique({ where: { id } });
    if (!existente) return NextResponse.json({ ok: false, error: "Plantilla no encontrada" }, { status: 404 });

    if (existente.esSistema && sesion.rol !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "No se puede modificar una plantilla del sistema" }, { status: 403 });
    }

    if (!existente.esSistema && existente.usuarioId !== sesion.id && sesion.rol !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Sin permiso para editar esta plantilla" }, { status: 403 });
    }

    const { nombre, tipo, etapa, objecion, asunto, cuerpo, esFavorita } = await req.json();

    const plantilla = await prisma.plantillaMensaje.update({
      where: { id },
      data: {
        ...(nombre ? { nombre } : {}),
        ...(tipo ? { tipo } : {}),
        ...(etapa !== undefined ? { etapa } : {}),
        ...(objecion !== undefined ? { objecion } : {}),
        ...(asunto !== undefined ? { asunto } : {}),
        ...(cuerpo ? { cuerpo } : {}),
        ...(esFavorita !== undefined ? { esFavorita } : {}),
      },
    });

    return NextResponse.json({ ok: true, data: plantilla });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al actualizar plantilla" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const { id } = await params;

    const existente = await prisma.plantillaMensaje.findUnique({ where: { id } });
    if (!existente) return NextResponse.json({ ok: false, error: "Plantilla no encontrada" }, { status: 404 });

    if (existente.esSistema) {
      return NextResponse.json({ ok: false, error: "No se puede eliminar una plantilla del sistema" }, { status: 403 });
    }

    if (existente.usuarioId !== sesion.id && sesion.rol !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Sin permiso para eliminar esta plantilla" }, { status: 403 });
    }

    await prisma.plantillaMensaje.delete({ where: { id } });

    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al eliminar plantilla" }, { status: 500 });
  }
}
