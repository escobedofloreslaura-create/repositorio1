import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, requerirSucursalActiva } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

export async function GET(req: NextRequest) {
  try {
    const sesion = await requerirSesionPos();
    const sucursalId = await requerirSucursalActiva(sesion);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const clientes = await prisma.posCliente.findMany({
      where: {
        sucursalId,
        activo: true,
        ...(q
          ? { OR: [{ nombre: { contains: q } }, { telefono: { contains: q } }] }
          : {}),
      },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json({ ok: true, data: clientes });
  } catch (e) {
    return respuestaError(e, "Error al obtener clientes");
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await requerirSesionPos();
    const sucursalId = await requerirSucursalActiva(sesion);
    const body = await req.json();
    const { nombre, direccion, telefono, limiteCredito, tipoPrecio } = body;

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "El nombre es requerido" }, { status: 400 });
    }

    const cliente = await prisma.posCliente.create({
      data: {
        sucursalId,
        nombre,
        direccion: direccion || null,
        telefono: telefono || null,
        limiteCredito: Number(limiteCredito) || 0,
        tipoPrecio: tipoPrecio || "VENTA",
      },
    });

    return NextResponse.json({ ok: true, data: cliente });
  } catch (e) {
    return respuestaError(e, "Error al crear cliente");
  }
}
