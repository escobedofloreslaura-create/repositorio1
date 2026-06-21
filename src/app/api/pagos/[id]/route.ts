import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";
import { registrarHistorial } from "@/lib/auditoria";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { id } = await params;

    const pago = await prisma.pago.findFirst({
      where: {
        id,
        eliminadoEn: null,
      },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true, vendedorId: true } },
      },
    });

    if (!pago) return NextResponse.json({ ok: false, error: "Pago no encontrado" }, { status: 404 });

    if (sesion.rol === "VENDEDOR" && pago.cliente.vendedorId !== sesion.id) {
      return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, data: pago });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener pago" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    const existente = await prisma.pago.findFirst({
      where: { id, eliminadoEn: null },
      include: { cliente: { select: { vendedorId: true } } },
    });

    if (!existente) return NextResponse.json({ ok: false, error: "Pago no encontrado" }, { status: 404 });
    if (sesion.rol === "VENDEDOR" && existente.cliente.vendedorId !== sesion.id) {
      return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });
    }

    const { monto, montoTotal, metodo, estatus, fechaPago, fechaVencimiento, concepto, notas } = body;

    const pago = await prisma.pago.update({
      where: { id },
      data: {
        ...(monto !== undefined ? { monto: parseFloat(String(monto)) } : {}),
        ...(montoTotal !== undefined ? { montoTotal: parseFloat(String(montoTotal)) } : {}),
        ...(metodo ? { metodo } : {}),
        ...(estatus ? { estatus } : {}),
        ...(fechaPago ? { fechaPago: new Date(fechaPago) } : {}),
        ...(fechaVencimiento !== undefined ? { fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null } : {}),
        ...(concepto ? { concepto } : {}),
        ...(notas !== undefined ? { notas } : {}),
      },
    });

    return NextResponse.json({ ok: true, data: pago });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al actualizar pago" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol !== "ADMIN") return NextResponse.json({ ok: false, error: "Solo administradores pueden eliminar pagos" }, { status: 403 });

    const { id } = await params;

    const existente = await prisma.pago.findFirst({ where: { id, eliminadoEn: null } });
    if (!existente) return NextResponse.json({ ok: false, error: "Pago no encontrado" }, { status: 404 });

    await prisma.pago.update({ where: { id }, data: { eliminadoEn: new Date() } });

    await registrarHistorial({
      clienteId: existente.clienteId,
      usuarioId: sesion.id,
      tipo: "PAGO_ELIMINADO",
      descripcion: `Pago eliminado: ${existente.folio} - $${existente.monto}`,
      metadatos: { pagoId: id, folio: existente.folio },
    });

    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al eliminar pago" }, { status: 500 });
  }
}
