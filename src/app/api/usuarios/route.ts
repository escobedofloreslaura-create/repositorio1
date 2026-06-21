import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol !== "ADMIN") return NextResponse.json({ ok: false, error: "Solo administradores" }, { status: 403 });

    const usuarios = await prisma.usuario.findMany({
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
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ ok: true, data: usuarios });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol !== "ADMIN") return NextResponse.json({ ok: false, error: "Solo administradores pueden crear usuarios" }, { status: 403 });

    const { nombre, correo, contrasena, rol, metaMensual, comision } = await req.json();

    if (!nombre || !correo || !contrasena) {
      return NextResponse.json({ ok: false, error: "Nombre, correo y contraseña son requeridos" }, { status: 400 });
    }

    if (!["ADMIN", "VENDEDOR", "LECTURA"].includes(rol ?? "VENDEDOR")) {
      return NextResponse.json({ ok: false, error: "Rol inválido" }, { status: 400 });
    }

    const existente = await prisma.usuario.findUnique({ where: { correo: correo.toLowerCase() } });
    if (existente) return NextResponse.json({ ok: false, error: "Ya existe un usuario con ese correo" }, { status: 409 });

    const contrasenaHash = await bcrypt.hash(contrasena, 12);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        correo: correo.toLowerCase(),
        contrasenaHash,
        rol: rol ?? "VENDEDOR",
        activo: true,
        metaMensual: metaMensual ?? null,
        comision: comision ?? null,
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        activo: true,
        metaMensual: true,
        comision: true,
      },
    });

    await registrarAuditoria({
      usuarioId: sesion.id,
      accion: "CREAR_USUARIO",
      recursoTipo: "usuario",
      recursoId: usuario.id,
      descripcion: `Usuario creado: ${nombre} (${correo}) - Rol: ${rol ?? "VENDEDOR"}`,
    });

    return NextResponse.json({ ok: true, data: usuario }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al crear usuario" }, { status: 500 });
  }
}
