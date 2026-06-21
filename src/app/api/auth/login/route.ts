import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearSesion, verificarContrasena } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function POST(req: NextRequest) {
  try {
    const { correo, contrasena } = await req.json();
    if (!correo || !contrasena) {
      return NextResponse.json({ ok: false, error: "Correo y contraseña son requeridos" }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({ where: { correo: correo.toLowerCase() } });

    if (!usuario || !usuario.activo) {
      return NextResponse.json({ ok: false, error: "Credenciales incorrectas" }, { status: 401 });
    }

    const ahora = new Date();
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > ahora) {
      const mins = Math.ceil((usuario.bloqueadoHasta.getTime() - ahora.getTime()) / 60000);
      return NextResponse.json({ ok: false, error: `Cuenta bloqueada. Intenta en ${mins} minutos` }, { status: 429 });
    }

    const valido = await verificarContrasena(contrasena, usuario.contrasenaHash);

    if (!valido) {
      const intentos = usuario.intentosFallidos + 1;
      const bloqueadoHasta = intentos >= 5 ? new Date(ahora.getTime() + 15 * 60 * 1000) : null;
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: intentos, bloqueadoHasta },
      });
      return NextResponse.json({ ok: false, error: "Credenciales incorrectas" }, { status: 401 });
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null },
    });

    const token = await crearSesion(usuario.id);

    await registrarAuditoria({
      usuarioId: usuario.id,
      accion: "LOGIN",
      recursoTipo: "sesion",
      descripcion: `Inicio de sesión: ${usuario.correo}`,
      ipOrigen: req.headers.get("x-forwarded-for") ?? undefined,
    });

    const res = NextResponse.json({ ok: true, data: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } });
    res.cookies.set("crm_session", token, {
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
