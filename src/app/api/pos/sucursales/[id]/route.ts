import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirAdminGeneral } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requerirAdminGeneral();
    const { id } = await params;
    const { nombre, direccion, telefono, activa } = await req.json();

    const sucursal = await prisma.posSucursal.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(direccion !== undefined ? { direccion: direccion || null } : {}),
        ...(telefono !== undefined ? { telefono: telefono || null } : {}),
        ...(activa !== undefined ? { activa } : {}),
      },
    });

    return NextResponse.json({ ok: true, data: sucursal });
  } catch (e) {
    return respuestaError(e, "Error al actualizar sucursal");
  }
}
