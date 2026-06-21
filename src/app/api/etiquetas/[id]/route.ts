import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const { id } = await params;
    const { nombre, color } = await req.json();

    const existente = await prisma.etiqueta.findUnique({ where: { id } });
    if (!existente) return NextResponse.json({ ok: false, error: "Etiqueta no encontrada" }, { status: 404 });

    const etiqueta = await prisma.etiqueta.update({
      where: { id },
      data: {
        ...(nombre ? { nombre } : {}),
        ...(color ? { color } : {}),
      },
    });

    return NextResponse.json({ ok: true, data: etiqueta });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al actualizar etiqueta" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol !== "ADMIN") return NextResponse.json({ ok: false, error: "Solo administradores" }, { status: 403 });

    const { id } = await params;

    const existente = await prisma.etiqueta.findUnique({ where: { id } });
    if (!existente) return NextResponse.json({ ok: false, error: "Etiqueta no encontrada" }, { status: 404 });

    // Delete client associations (cascade), then delete the tag
    await prisma.$transaction([
      prisma.etiquetaCliente.deleteMany({ where: { etiquetaId: id } }),
      prisma.etiqueta.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al eliminar etiqueta" }, { status: 500 });
  }
}
