import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirAdminPos, esAdminGeneral, hashearContrasenaPos, LIMITE_ADMINISTRADORES, LIMITE_CAJEROS } from "@/lib/pos/auth";
import { LIMITE_ADMIN_GENERAL } from "@/lib/pos/constantes";
import { respuestaError } from "@/lib/pos/api-utils";

function limitePara(rol: string, sucursalId: string | null): number {
  if (sucursalId === null) return LIMITE_ADMIN_GENERAL;
  return rol === "ADMINISTRADOR" ? LIMITE_ADMINISTRADORES : LIMITE_CAJEROS;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirAdminPos();
    const { id } = await params;
    const { nombre, contrasena, rol, activo } = await req.json();

    const existente = await prisma.posUsuario.findUniqueOrThrow({ where: { id } });
    if (!esAdminGeneral(sesion) && existente.sucursalId !== sesion.sucursalId) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }
    // Un administrador de tienda no puede convertir a nadie en Administrador
    // General ni cambiar de sucursal desde aquí.
    if (!esAdminGeneral(sesion) && existente.sucursalId === null) {
      return NextResponse.json({ ok: false, error: "No puedes editar a un Administrador General" }, { status: 403 });
    }

    if (rol && rol !== existente.rol) {
      const activos = await prisma.posUsuario.count({ where: { rol, sucursalId: existente.sucursalId, activo: true, NOT: { id } } });
      const limite = limitePara(rol, existente.sucursalId);
      if (activos >= limite) {
        return NextResponse.json({ ok: false, error: `Ya existe el máximo de ${limite} usuarios con ese rol` }, { status: 409 });
      }
    }

    if (activo === true && existente.activo === false) {
      const rolFinal = rol || existente.rol;
      const activos = await prisma.posUsuario.count({ where: { rol: rolFinal, sucursalId: existente.sucursalId, activo: true } });
      const limite = limitePara(rolFinal, existente.sucursalId);
      if (activos >= limite) {
        return NextResponse.json({ ok: false, error: `Ya existe el máximo de ${limite} usuarios activos con ese rol` }, { status: 409 });
      }
    }

    if (activo === false && existente.rol === "ADMINISTRADOR" && existente.id === sesion.id) {
      const otrosAdmins = await prisma.posUsuario.count({ where: { rol: "ADMINISTRADOR", sucursalId: existente.sucursalId, activo: true, NOT: { id } } });
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
      select: { id: true, nombre: true, usuario: true, rol: true, sucursalId: true, activo: true, creadoEn: true },
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

    const existente = await prisma.posUsuario.findUniqueOrThrow({ where: { id } });
    if (!esAdminGeneral(sesion) && existente.sucursalId !== sesion.sucursalId) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    await prisma.posUsuario.update({ where: { id }, data: { activo: false } });
    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    return respuestaError(e, "Error al eliminar usuario");
  }
}
