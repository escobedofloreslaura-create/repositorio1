import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, obtenerSucursalActiva, POS_SUCURSAL_COOKIE } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

// Sucursal en la que el usuario está operando (su propia tienda, o la
// elegida por el Administrador General).
export async function GET() {
  try {
    const sesion = await requerirSesionPos();
    const sucursalId = await obtenerSucursalActiva(sesion);
    if (!sucursalId) return NextResponse.json({ ok: true, data: null });
    const sucursal = await prisma.posSucursal.findUnique({ where: { id: sucursalId } });
    return NextResponse.json({ ok: true, data: sucursal });
  } catch (e) {
    return respuestaError(e, "Error al obtener la sucursal activa");
  }
}

// Cambiar de sucursal: solo tiene efecto para el Administrador General — un
// usuario de tienda siempre opera en la suya.
export async function POST(req: NextRequest) {
  try {
    const sesion = await requerirSesionPos();
    if (sesion.sucursalId !== null) {
      return NextResponse.json({ ok: false, error: "Tu usuario pertenece a una sola sucursal" }, { status: 403 });
    }
    const { sucursalId } = await req.json();
    const sucursal = await prisma.posSucursal.findUnique({ where: { id: sucursalId } });
    if (!sucursal || !sucursal.activa) {
      return NextResponse.json({ ok: false, error: "Sucursal no encontrada" }, { status: 404 });
    }

    const res = NextResponse.json({ ok: true, data: sucursal });
    res.cookies.set(POS_SUCURSAL_COOKIE, sucursal.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return res;
  } catch (e) {
    return respuestaError(e, "Error al cambiar de sucursal");
  }
}
