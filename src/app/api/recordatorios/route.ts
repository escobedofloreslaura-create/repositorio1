import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const completadoParam = searchParams.get("completado");
    const fecha = searchParams.get("fecha");

    const where: Record<string, unknown> = { usuarioId: sesion.id };

    if (completadoParam !== null) {
      where.completado = completadoParam === "true";
    }

    if (fecha) {
      const inicio = new Date(fecha);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(23, 59, 59, 999);
      where.fecha = { gte: inicio, lte: fin };
    }

    const recordatorios = await prisma.recordatorio.findMany({
      where,
      orderBy: { fecha: "asc" },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
      },
    });

    return NextResponse.json({ ok: true, data: recordatorios });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener recordatorios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { texto, fecha, clienteId } = await req.json();

    if (!texto || !fecha) {
      return NextResponse.json({ ok: false, error: "Texto y fecha son requeridos" }, { status: 400 });
    }

    const recordatorio = await prisma.recordatorio.create({
      data: {
        usuarioId: sesion.id,
        texto,
        fecha: new Date(fecha),
        clienteId: clienteId ?? null,
        completado: false,
        pospuesto: false,
      },
    });

    return NextResponse.json({ ok: true, data: recordatorio }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al crear recordatorio" }, { status: 500 });
  }
}
