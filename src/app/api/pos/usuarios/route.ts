import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirAdminPos, hashearContrasenaPos, LIMITE_ADMINISTRADORES, LIMITE_CAJEROS } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

export async function GET() {
  try {
    await requerirAdminPos();
    const usuarios = await prisma.posUsuario.findMany({
      select: { id: true, nombre: true, usuario: true, rol: true, activo: true, creadoEn: true },
      orderBy: [{ rol: "asc" }, { nombre: "asc" }],
    });
    return NextResponse.json({ ok: true, data: usuarios });
  } catch (e) {
    return respuestaError(e, "Error al obtener usuarios");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requerirAdminPos();
    const { nombre, usuario, contrasena, rol } = await req.json();

    if (!nombre || !usuario || !contrasena) {
      return NextResponse.json({ ok: false, error: "Nombre, usuario y contraseña son requeridos" }, { status: 400 });
    }
    if (contrasena.length < 6) {
      return NextResponse.json({ ok: false, error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }
    const rolFinal = rol === "ADMINISTRADOR" ? "ADMINISTRADOR" : "CAJERO";

    const activos = await prisma.posUsuario.count({ where: { rol: rolFinal, activo: true } });
    const limite = rolFinal === "ADMINISTRADOR" ? LIMITE_ADMINISTRADORES : LIMITE_CAJEROS;
    if (activos >= limite) {
      return NextResponse.json(
        { ok: false, error: `Ya existe el máximo de ${limite} ${rolFinal === "ADMINISTRADOR" ? "administradores" : "cajeros"} activos` },
        { status: 409 }
      );
    }

    const posUsuario = await prisma.posUsuario.create({
      data: {
        nombre,
        usuario: usuario.toLowerCase().trim(),
        contrasenaHash: await hashearContrasenaPos(contrasena),
        rol: rolFinal,
      },
      select: { id: true, nombre: true, usuario: true, rol: true, activo: true, creadoEn: true },
    });

    return NextResponse.json({ ok: true, data: posUsuario });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return NextResponse.json({ ok: false, error: "Ese nombre de usuario ya existe" }, { status: 409 });
    }
    return respuestaError(e, "Error al crear usuario");
  }
}
