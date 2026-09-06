import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, requerirAdminPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

export async function GET() {
  try {
    await requerirSesionPos();
    const config = await prisma.posConfiguracion.upsert({
      where: { id: "principal" },
      update: {},
      create: { id: "principal" },
    });
    return NextResponse.json({ ok: true, data: config });
  } catch (e) {
    return respuestaError(e, "Error al obtener la configuración");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requerirAdminPos();
    const body = await req.json();
    const { nombreNegocio, direccion, telefono, rfc, mensajeTicket, impresora, moneda, simboloMoneda } = body;

    const config = await prisma.posConfiguracion.upsert({
      where: { id: "principal" },
      update: {
        ...(nombreNegocio !== undefined ? { nombreNegocio } : {}),
        ...(direccion !== undefined ? { direccion } : {}),
        ...(telefono !== undefined ? { telefono } : {}),
        ...(rfc !== undefined ? { rfc } : {}),
        ...(mensajeTicket !== undefined ? { mensajeTicket } : {}),
        ...(impresora !== undefined ? { impresora } : {}),
        ...(moneda !== undefined ? { moneda } : {}),
        ...(simboloMoneda !== undefined ? { simboloMoneda } : {}),
      },
      create: { id: "principal", nombreNegocio, direccion, telefono, rfc, mensajeTicket, impresora, moneda, simboloMoneda },
    });

    return NextResponse.json({ ok: true, data: config });
  } catch (e) {
    return respuestaError(e, "Error al guardar la configuración");
  }
}
