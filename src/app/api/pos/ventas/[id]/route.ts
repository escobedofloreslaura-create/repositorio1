import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requerirSesionPos();
    const { id } = await params;
    const venta = await prisma.posVenta.findUnique({
      where: { id },
      include: {
        detalles: { include: { producto: { select: { nombre: true } } } },
        pagos: true,
        devoluciones: true,
        cliente: true,
        usuario: { select: { nombre: true } },
      },
    });
    if (!venta) return NextResponse.json({ ok: false, error: "Venta no encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true, data: venta });
  } catch (e) {
    return respuestaError(e, "Error al obtener la venta");
  }
}
