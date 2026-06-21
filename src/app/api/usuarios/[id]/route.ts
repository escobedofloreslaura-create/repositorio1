import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { id } = await params;

    if (sesion.rol !== "ADMIN" && sesion.id !== id) {
      return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        activo: true,
        avatarUrl: true,
        metaMensual: true,
        comision: true,
        paginaAgendaActiva: true,
        paginaAgendaSlug: true,
        temaPreferido: true,
        vistaCompacta: true,
        onboardingCompletado: true,
      },
    });

    if (!usuario) return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json({ ok: true, data: usuario });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener usuario" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const esAdmin = sesion.rol === "ADMIN";
    const esPropioUsuario = sesion.id === id;

    if (!esAdmin && !esPropioUsuario) {
      return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });
    }

    const existente = await prisma.usuario.findUnique({ where: { id } });
    if (!existente) return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

    const updateData: Record<string, unknown> = {};

    if (esAdmin) {
      // Admin can change: rol, activo, metaMensual, comision, paginaAgendaActiva, paginaAgendaSlug
      if (body.rol !== undefined) updateData.rol = body.rol;
      if (body.activo !== undefined) updateData.activo = body.activo;
      if (body.metaMensual !== undefined) updateData.metaMensual = body.metaMensual;
      if (body.comision !== undefined) updateData.comision = body.comision;
      if (body.paginaAgendaActiva !== undefined) updateData.paginaAgendaActiva = body.paginaAgendaActiva;
      if (body.paginaAgendaSlug !== undefined) updateData.paginaAgendaSlug = body.paginaAgendaSlug;
    }

    if (esPropioUsuario) {
      // Self can change: nombre, avatarUrl, vistaCompacta, onboardingCompletado, contrasena
      if (body.nombre !== undefined) updateData.nombre = body.nombre;
      if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
      if (body.vistaCompacta !== undefined) updateData.vistaCompacta = body.vistaCompacta;
      if (body.onboardingCompletado !== undefined) updateData.onboardingCompletado = body.onboardingCompletado;
      if (body.metaMensual !== undefined && !esAdmin) updateData.metaMensual = body.metaMensual;

      if (body.contrasena) {
        updateData.contrasenaHash = await bcrypt.hash(body.contrasena, 12);
        updateData.intentosFallidos = 0;
        updateData.bloqueadoHasta = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ ok: false, error: "Nada que actualizar" }, { status: 400 });
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        activo: true,
        avatarUrl: true,
        metaMensual: true,
        comision: true,
        paginaAgendaActiva: true,
        paginaAgendaSlug: true,
        temaPreferido: true,
        vistaCompacta: true,
        onboardingCompletado: true,
      },
    });

    if (esAdmin && body.rol !== undefined && body.rol !== existente.rol) {
      await registrarAuditoria({
        usuarioId: sesion.id,
        accion: "CAMBIO_ROL",
        recursoTipo: "usuario",
        recursoId: id,
        descripcion: `Rol cambiado: ${existente.rol} → ${body.rol} para ${existente.nombre}`,
      });
    }

    return NextResponse.json({ ok: true, data: usuario });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al actualizar usuario" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol !== "ADMIN") return NextResponse.json({ ok: false, error: "Solo administradores" }, { status: 403 });

    const { id } = await params;

    if (sesion.id === id) {
      return NextResponse.json({ ok: false, error: "No puedes desactivar tu propia cuenta" }, { status: 400 });
    }

    const existente = await prisma.usuario.findUnique({ where: { id } });
    if (!existente) return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

    // Soft delete = deactivate
    await prisma.usuario.update({ where: { id }, data: { activo: false } });

    await registrarAuditoria({
      usuarioId: sesion.id,
      accion: "DESACTIVAR_USUARIO",
      recursoTipo: "usuario",
      recursoId: id,
      descripcion: `Usuario desactivado: ${existente.nombre} (${existente.correo})`,
    });

    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al desactivar usuario" }, { status: 500 });
  }
}
