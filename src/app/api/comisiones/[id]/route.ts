import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  await prisma.comision.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { tipo, aseguradora, monto, fecha, clienteId, notas } = body;
  const comision = await prisma.comision.update({
    where: { id },
    data: {
      ...(tipo && { tipo }),
      ...(aseguradora && { aseguradora }),
      ...(monto && { monto: Number(monto) }),
      ...(fecha && { fecha: new Date(fecha) }),
      clienteId: clienteId || null,
      notas: notas || null,
    },
    include: { cliente: { select: { id: true, nombre: true } } },
  });
  return NextResponse.json({ ok: true, data: comision });
}
