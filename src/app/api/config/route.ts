import { NextRequest, NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  const config = await prisma.configNegocio.findFirst();
  return NextResponse.json({ ok: true, data: config });
}

export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });

  try {
    const data = await req.json();
    const config = await prisma.configNegocio.upsert({
      where: { id: "principal" },
      update: data,
      create: { id: "principal", ...data },
    });
    return NextResponse.json({ ok: true, data: config });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Error al guardar configuración" }, { status: 500 });
  }
}
