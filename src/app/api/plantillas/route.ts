import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function GET() {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const plantillas = await prisma.plantillaMensaje.findMany({
      where: {
        OR: [
          { esSistema: true },
          { usuarioId: sesion.id },
        ],
      },
      orderBy: [{ esFavorita: "desc" }, { nombre: "asc" }],
    });

    return NextResponse.json({ ok: true, data: plantillas });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener plantillas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const { nombre, tipo, etapa, objecion, asunto, cuerpo, esFavorita } = await req.json();

    if (!nombre || !tipo || !cuerpo) {
      return NextResponse.json({ ok: false, error: "Nombre, tipo y cuerpo son requeridos" }, { status: 400 });
    }

    const plantilla = await prisma.plantillaMensaje.create({
      data: {
        nombre,
        tipo,
        etapa: etapa ?? null,
        objecion: objecion ?? null,
        asunto: asunto ?? null,
        cuerpo,
        esFavorita: esFavorita ?? false,
        esSistema: false,
        usuarioId: sesion.id,
      },
    });

    return NextResponse.json({ ok: true, data: plantilla }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al crear plantilla" }, { status: 500 });
  }
}
