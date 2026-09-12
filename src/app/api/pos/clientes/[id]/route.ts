import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, esAdminGeneral } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

// Detalle del cliente + estado de cuenta: historial de ventas a crédito,
// fechas y saldo pendiente.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesionPos();
    const { id } = await params;

    const cliente = await prisma.posCliente.findUnique({ where: { id } });
    if (!cliente) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    if (!esAdminGeneral(sesion) && cliente.sucursalId !== sesion.sucursalId) {
      return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    }

    const ventas = await prisma.posVenta.findMany({
      where: { clienteId: id, pagos: { some: { forma: "CREDITO" } } },
      include: { detalles: true, pagos: true, usuario: { select: { nombre: true } } },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json({ ok: true, data: { cliente, ventasCredito: ventas } });
  } catch (e) {
    return respuestaError(e, "Error al obtener el cliente");
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesionPos();
    const { id } = await params;

    const existente = await prisma.posCliente.findUnique({ where: { id } });
    if (!existente) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    if (!esAdminGeneral(sesion) && existente.sucursalId !== sesion.sucursalId) {
      return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { nombre, direccion, telefono, limiteCredito, tipoPrecio, activo } = body;

    const cliente = await prisma.posCliente.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(direccion !== undefined ? { direccion: direccion || null } : {}),
        ...(telefono !== undefined ? { telefono: telefono || null } : {}),
        ...(limiteCredito !== undefined ? { limiteCredito: Number(limiteCredito) } : {}),
        ...(tipoPrecio !== undefined ? { tipoPrecio } : {}),
        ...(activo !== undefined ? { activo } : {}),
      },
    });

    return NextResponse.json({ ok: true, data: cliente });
  } catch (e) {
    return respuestaError(e, "Error al actualizar cliente");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesionPos();
    const { id } = await params;

    const existente = await prisma.posCliente.findUnique({ where: { id } });
    if (!existente) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    if (!esAdminGeneral(sesion) && existente.sucursalId !== sesion.sucursalId) {
      return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    }

    await prisma.posCliente.update({ where: { id }, data: { activo: false } });
    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    return respuestaError(e, "Error al eliminar cliente");
  }
}
