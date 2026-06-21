import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function GET() {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const etiquetas = await prisma.etiqueta.findMany({
      orderBy: { nombre: "asc" },
      include: {
        _count: { select: { clientes: true } },
      },
    });

    return NextResponse.json({ ok: true, data: etiquetas });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener etiquetas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const { nombre, color } = await req.json();

    if (!nombre) return NextResponse.json({ ok: false, error: "Nombre requerido" }, { status: 400 });

    const existente = await prisma.etiqueta.findFirst({ where: { nombre: { equals: nombre } } });
    if (existente) return NextResponse.json({ ok: false, error: "Ya existe una etiqueta con ese nombre" }, { status: 409 });

    const etiqueta = await prisma.etiqueta.create({
      data: { nombre, color: color ?? "#6366f1" },
    });

    return NextResponse.json({ ok: true, data: etiqueta }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al crear etiqueta" }, { status: 500 });
  }
}
