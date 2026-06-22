import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes"); // YYYY-MM
  const vendedorId = sesion.rol === "VENDEDOR" ? sesion.id : (searchParams.get("vendedorId") ?? undefined);

  const comisiones = await prisma.comision.findMany({
    where: {
      ...(vendedorId ? { vendedorId } : {}),
      ...(mes ? (() => { const [y, m] = mes.split("-").map(Number); return { fecha: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } }; })() : {}),
    },
    orderBy: { fecha: "desc" },
    include: { cliente: { select: { id: true, nombre: true } } },
  });

  const totalComisiones = comisiones.filter((c) => c.tipo === "COMISION").reduce((s, c) => s + c.monto, 0);
  const totalBonos = comisiones.filter((c) => c.tipo === "BONO").reduce((s, c) => s + c.monto, 0);

  return NextResponse.json({ ok: true, data: comisiones, totalComisiones, totalBonos, total: totalComisiones + totalBonos });
}

export async function POST(req: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const { tipo, aseguradora, monto, fecha, clienteId, notas } = body;

  if (!aseguradora || !monto || !fecha) {
    return NextResponse.json({ ok: false, error: "Aseguradora, monto y fecha son requeridos" }, { status: 400 });
  }

  const comision = await prisma.comision.create({
    data: {
      vendedorId: sesion.id,
      tipo: tipo ?? "COMISION",
      aseguradora,
      monto: Number(monto),
      fecha: new Date(fecha),
      clienteId: clienteId || null,
      notas: notas || null,
    },
    include: { cliente: { select: { id: true, nombre: true } } },
  });

  return NextResponse.json({ ok: true, data: comision }, { status: 201 });
}
