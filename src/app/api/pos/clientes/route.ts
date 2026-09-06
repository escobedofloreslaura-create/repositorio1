import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

export async function GET(req: NextRequest) {
  try {
    await requerirSesionPos();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const clientes = await prisma.posCliente.findMany({
      where: {
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
    await requerirSesionPos();
    const body = await req.json();
    const { nombre, direccion, telefono, limiteCredito } = body;

    if (!nombre) {
      return NextResponse.json({ ok: false, error: "El nombre es requerido" }, { status: 400 });
    }

    const cliente = await prisma.posCliente.create({
      data: {
        nombre,
        direccion: direccion || null,
        telefono: telefono || null,
        limiteCredito: Number(limiteCredito) || 0,
      },
    });

    return NextResponse.json({ ok: true, data: cliente });
  } catch (e) {
    return respuestaError(e, "Error al crear cliente");
  }
}
