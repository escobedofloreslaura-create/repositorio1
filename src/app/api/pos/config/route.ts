import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, requerirAdminPos, requerirSucursalActiva } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

export async function GET() {
  try {
    const sesion = await requerirSesionPos();
    const sucursalId = await requerirSucursalActiva(sesion);
    const config = await prisma.posConfiguracion.upsert({
      where: { sucursalId },
      update: {},
      create: { sucursalId },
    });
    return NextResponse.json({ ok: true, data: config });
  } catch (e) {
    return respuestaError(e, "Error al obtener la configuración");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sesion = await requerirAdminPos();
    const sucursalId = await requerirSucursalActiva(sesion);
    const body = await req.json();
    const { nombreNegocio, direccion, telefono, rfc, mensajeTicket, logoUrl, impresora, moneda, simboloMoneda } = body;

    const config = await prisma.posConfiguracion.upsert({
      where: { sucursalId },
      update: {
        ...(nombreNegocio !== undefined ? { nombreNegocio } : {}),
        ...(direccion !== undefined ? { direccion } : {}),
        ...(telefono !== undefined ? { telefono } : {}),
        ...(rfc !== undefined ? { rfc } : {}),
        ...(mensajeTicket !== undefined ? { mensajeTicket } : {}),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(impresora !== undefined ? { impresora } : {}),
        ...(moneda !== undefined ? { moneda } : {}),
        ...(simboloMoneda !== undefined ? { simboloMoneda } : {}),
      },
      create: { sucursalId, nombreNegocio, direccion, telefono, rfc, mensajeTicket, logoUrl, impresora, moneda, simboloMoneda },
    });

    return NextResponse.json({ ok: true, data: config });
  } catch (e) {
    return respuestaError(e, "Error al guardar la configuración");
  }
}
