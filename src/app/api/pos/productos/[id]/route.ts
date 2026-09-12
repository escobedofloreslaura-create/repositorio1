import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirAdminGeneral } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

// El catálogo y los precios son compartidos por toda la cadena — solo el
// Administrador General puede editarlos.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requerirAdminGeneral();
    const { id } = await params;
    const body = await req.json();
    const { nombre, codigoBarras, departamentoId, unidad, precioCosto, precioVenta, precioMayoreo, precioClienteFrecuente, activo } = body;

    const producto = await prisma.posProducto.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(codigoBarras !== undefined ? { codigoBarras: codigoBarras || null } : {}),
        ...(departamentoId !== undefined ? { departamentoId } : {}),
        ...(unidad !== undefined ? { unidad } : {}),
        ...(precioCosto !== undefined ? { precioCosto: Number(precioCosto) } : {}),
        ...(precioVenta !== undefined ? { precioVenta: Number(precioVenta) } : {}),
        ...(precioMayoreo !== undefined ? { precioMayoreo: precioMayoreo === null || precioMayoreo === "" ? null : Number(precioMayoreo) } : {}),
        ...(precioClienteFrecuente !== undefined
          ? { precioClienteFrecuente: precioClienteFrecuente === null || precioClienteFrecuente === "" ? null : Number(precioClienteFrecuente) }
          : {}),
        ...(activo !== undefined ? { activo } : {}),
      },
      include: { departamento: true },
    });

    return NextResponse.json({ ok: true, data: producto });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return NextResponse.json({ ok: false, error: "Ya existe un producto con ese código de barras" }, { status: 409 });
    }
    return respuestaError(e, "Error al actualizar producto");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requerirAdminGeneral();
    const { id } = await params;
    await prisma.posProducto.update({ where: { id }, data: { activo: false } });
    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    return respuestaError(e, "Error al eliminar producto");
  }
}
