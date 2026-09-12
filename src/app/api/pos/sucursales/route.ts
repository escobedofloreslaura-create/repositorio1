import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, requerirAdminGeneral } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

export async function GET() {
  try {
    const sesion = await requerirSesionPos();
    // Cualquier usuario autenticado puede listar sucursales activas (el
    // selector de tienda del Administrador General las necesita), pero solo
    // el Administrador General ve las inactivas.
    const sucursales = await prisma.posSucursal.findMany({
      where: sesion.sucursalId === null ? {} : { activa: true },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json({ ok: true, data: sucursales });
  } catch (e) {
    return respuestaError(e, "Error al obtener sucursales");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requerirAdminGeneral();
    const { nombre, direccion, telefono } = await req.json();
    if (!nombre || !String(nombre).trim()) {
      return NextResponse.json({ ok: false, error: "El nombre es requerido" }, { status: 400 });
    }

    const sucursal = await prisma.posSucursal.create({
      data: { nombre: String(nombre).trim(), direccion: direccion || null, telefono: telefono || null },
    });

    await prisma.posConfiguracion.create({ data: { sucursalId: sucursal.id, nombreNegocio: sucursal.nombre } });

    return NextResponse.json({ ok: true, data: sucursal });
  } catch (e) {
    return respuestaError(e, "Error al crear sucursal");
  }
}
