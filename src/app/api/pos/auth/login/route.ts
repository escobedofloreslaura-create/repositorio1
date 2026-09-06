import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearSesionPos, verificarContrasenaPos, POS_COOKIE } from "@/lib/pos/auth";

export async function POST(req: NextRequest) {
  try {
    const { usuario, contrasena } = await req.json();
    if (!usuario || !contrasena) {
      return NextResponse.json({ ok: false, error: "Usuario y contraseña son requeridos" }, { status: 400 });
    }

    const posUsuario = await prisma.posUsuario.findUnique({ where: { usuario: usuario.toLowerCase().trim() } });

    if (!posUsuario || !posUsuario.activo) {
      return NextResponse.json({ ok: false, error: "Credenciales incorrectas" }, { status: 401 });
    }

    const ahora = new Date();
    if (posUsuario.bloqueadoHasta && posUsuario.bloqueadoHasta > ahora) {
      const mins = Math.ceil((posUsuario.bloqueadoHasta.getTime() - ahora.getTime()) / 60000);
      return NextResponse.json({ ok: false, error: `Cuenta bloqueada. Intenta en ${mins} minutos` }, { status: 429 });
    }

    const valido = await verificarContrasenaPos(contrasena, posUsuario.contrasenaHash);

    if (!valido) {
      const intentos = posUsuario.intentosFallidos + 1;
      const bloqueadoHasta = intentos >= 5 ? new Date(ahora.getTime() + 15 * 60 * 1000) : null;
      await prisma.posUsuario.update({
        where: { id: posUsuario.id },
        data: { intentosFallidos: intentos, bloqueadoHasta },
      });
      return NextResponse.json({ ok: false, error: "Credenciales incorrectas" }, { status: 401 });
    }

    await prisma.posUsuario.update({
      where: { id: posUsuario.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null },
    });

    const token = await crearSesionPos(posUsuario.id);

    const res = NextResponse.json({
      ok: true,
      data: { id: posUsuario.id, nombre: posUsuario.nombre, rol: posUsuario.rol },
    });
    res.cookies.set(POS_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
