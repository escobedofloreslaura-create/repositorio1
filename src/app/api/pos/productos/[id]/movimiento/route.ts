import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirAdminPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";
import { registrarMovimientoInventario } from "@/lib/pos/kardex";

// Entradas / salidas / ajustes manuales de inventario (Kardex).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirAdminPos();
    const { id } = await params;
    const body = await req.json();
    const { tipo, cantidad, nuevaExistencia, detalle } = body as {
      tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
      cantidad?: number;
      nuevaExistencia?: number;
      detalle?: string;
    };

    if (!["ENTRADA", "SALIDA", "AJUSTE"].includes(tipo)) {
      return NextResponse.json({ ok: false, error: "Tipo de movimiento inválido" }, { status: 400 });
    }

    const existenciaNueva = await prisma.$transaction(async (tx) => {
      let delta: number;
      if (tipo === "AJUSTE") {
        const producto = await tx.posProducto.findUniqueOrThrow({ where: { id } });
        if (nuevaExistencia === undefined) throw new Error("nuevaExistencia requerida para un ajuste");
        delta = Number(nuevaExistencia) - producto.existencia;
      } else {
        const magnitud = Math.abs(Number(cantidad) || 0);
        if (magnitud <= 0) throw new Error("La cantidad debe ser mayor a cero");
        delta = tipo === "ENTRADA" ? magnitud : -magnitud;
      }

      return registrarMovimientoInventario(tx, {
        productoId: id,
        tipo,
        delta,
        detalle,
        usuarioId: sesion.id,
      });
    });

    return NextResponse.json({ ok: true, data: { existencia: existenciaNueva } });
  } catch (e) {
    if (e instanceof Error && (e.message === "nuevaExistencia requerida para un ajuste" || e.message === "La cantidad debe ser mayor a cero")) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
    return respuestaError(e, "Error al registrar movimiento de inventario");
  }
}
