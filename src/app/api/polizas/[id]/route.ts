import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { numeroPoliza, producto, aseguradora, formaPago, fechaProximoPago, monto, notas, activa } = body;

  const poliza = await prisma.poliza.update({
    where: { id },
    data: {
      ...(numeroPoliza !== undefined && { numeroPoliza }),
      ...(producto !== undefined && { producto }),
      ...(aseguradora !== undefined && { aseguradora }),
      ...(formaPago !== undefined && { formaPago }),
      fechaProximoPago: fechaProximoPago ? new Date(fechaProximoPago) : null,
      ...(monto !== undefined && { monto: monto ? Number(monto) : null }),
      ...(notas !== undefined && { notas: notas || null }),
      ...(activa !== undefined && { activa }),
    },
  });

  return NextResponse.json({ ok: true, data: poliza });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  await prisma.poliza.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
