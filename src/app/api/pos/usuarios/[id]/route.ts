import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirAdminPos, hashearContrasenaPos, LIMITE_ADMINISTRADORES, LIMITE_CAJEROS } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirAdminPos();
    const { id } = await params;
    const { nombre, contrasena, rol, activo } = await req.json();

    const existente = await prisma.posUsuario.findUniqueOrThrow({ where: { id } });

    if (rol && rol !== existente.rol) {
      const activos = await prisma.posUsuario.count({ where: { rol, activo: true, NOT: { id } } });
      const limite = rol === "ADMINISTRADOR" ? LIMITE_ADMINISTRADORES : LIMITE_CAJEROS;
      if (activos >= limite) {
        return NextResponse.json({ ok: false, error: `Ya existe el máximo de ${limite} usuarios con ese rol` }, { status: 409 });
      }
    }

    if (activo === true && existente.activo === false) {
      const rolFinal = rol || existente.rol;
      const activos = await prisma.posUsuario.count({ where: { rol: rolFinal, activo: true } });
      const limite = rolFinal === "ADMINISTRADOR" ? LIMITE_ADMINISTRADORES : LIMITE_CAJEROS;
      if (activos >= limite) {
        return NextResponse.json({ ok: false, error: `Ya existe el máximo de ${limite} usuarios activos con ese rol` }, { status: 409 });
      }
    }

    if (activo === false && existente.rol === "ADMINISTRADOR" && existente.id === sesion.id) {
      const otrosAdmins = await prisma.posUsuario.count({ where: { rol: "ADMINISTRADOR", activo: true, NOT: { id } } });
      if (otrosAdmins === 0) {
        return NextResponse.json({ ok: false, error: "No puedes desactivarte: eres el único administrador activo" }, { status: 409 });
      }
    }

    const usuario = await prisma.posUsuario.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(rol !== undefined ? { rol } : {}),
        ...(activo !== undefined ? { activo } : {}),
        ...(contrasena ? { contrasenaHash: await hashearContrasenaPos(contrasena) } : {}),
      },
      select: { id: true, nombre: true, usuario: true, rol: true, activo: true, creadoEn: true },
    });

    return NextResponse.json({ ok: true, data: usuario });
  } catch (e) {
    return respuestaError(e, "Error al actualizar usuario");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirAdminPos();
    const { id } = await params;

    if (id === sesion.id) {
      return NextResponse.json({ ok: false, error: "No puedes eliminar tu propio usuario" }, { status: 409 });
    }

    await prisma.posUsuario.update({ where: { id }, data: { activo: false } });
    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    return respuestaError(e, "Error al eliminar usuario");
  }
}
