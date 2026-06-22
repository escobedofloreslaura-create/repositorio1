import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  const clienteId = new URL(req.url).searchParams.get("clienteId");
  if (!clienteId) return NextResponse.json({ ok: false, error: "clienteId requerido" }, { status: 400 });

  const polizas = await prisma.poliza.findMany({
    where: { clienteId },
    orderBy: { creadoEn: "desc" },
  });
  return NextResponse.json({ ok: true, data: polizas });
}

export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { clienteId, numeroPoliza, producto, aseguradora, formaPago, fechaProximoPago, monto, notas } = body;

  if (!clienteId || !numeroPoliza || !producto || !aseguradora) {
    return NextResponse.json({ ok: false, error: "Campos requeridos faltantes" }, { status: 400 });
  }

  const poliza = await prisma.poliza.create({
    data: {
      clienteId,
      numeroPoliza,
      producto,
      aseguradora,
      formaPago: formaPago ?? "MENSUAL",
      fechaProximoPago: fechaProximoPago ? new Date(fechaProximoPago) : null,
      monto: monto ? Number(monto) : null,
      notas: notas || null,
    },
  });

  return NextResponse.json({ ok: true, data: poliza }, { status: 201 });
}
