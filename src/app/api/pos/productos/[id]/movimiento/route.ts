import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirAdminPos, obtenerSucursalActiva } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";
import { registrarMovimientoInventario } from "@/lib/pos/kardex";

// Entradas / salidas / ajustes manuales de inventario (Kardex), en la
// sucursal en la que el usuario está operando. Un administrador de tienda
// puede ajustar el inventario de SU tienda; el Administrador General, el de
// la sucursal que tenga elegida.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirAdminPos();
    const { id } = await params;
    const body = await req.json();
    const { tipo, cantidad, nuevaExistencia, existenciaMinima, detalle } = body as {
      tipo?: "ENTRADA" | "SALIDA" | "AJUSTE";
      cantidad?: number;
      nuevaExistencia?: number;
      existenciaMinima?: number;
      detalle?: string;
    };

    const sucursalId = await obtenerSucursalActiva(sesion);
    if (!sucursalId) return NextResponse.json({ ok: false, error: "No hay una sucursal activa" }, { status: 409 });

    if (tipo && !["ENTRADA", "SALIDA", "AJUSTE"].includes(tipo)) {
      return NextResponse.json({ ok: false, error: "Tipo de movimiento inválido" }, { status: 400 });
    }

    const existenciaResultado = await prisma.$transaction(async (tx) => {
      await tx.posExistencia.upsert({
        where: { sucursalId_productoId: { sucursalId, productoId: id } },
        update: {},
        create: { sucursalId, productoId: id },
      });

      if (existenciaMinima !== undefined) {
        await tx.posExistencia.update({
          where: { sucursalId_productoId: { sucursalId, productoId: id } },
          data: { existenciaMinima: Number(existenciaMinima) },
        });
      }

      if (!tipo) {
        const actual = await tx.posExistencia.findUniqueOrThrow({ where: { sucursalId_productoId: { sucursalId, productoId: id } } });
        return actual.existencia;
      }

      let delta: number;
      if (tipo === "AJUSTE") {
        const existente = await tx.posExistencia.findUniqueOrThrow({ where: { sucursalId_productoId: { sucursalId, productoId: id } } });
        if (nuevaExistencia === undefined) throw new Error("nuevaExistencia requerida para un ajuste");
        delta = Number(nuevaExistencia) - existente.existencia;
      } else {
        const magnitud = Math.abs(Number(cantidad) || 0);
        if (magnitud <= 0) throw new Error("La cantidad debe ser mayor a cero");
        delta = tipo === "ENTRADA" ? magnitud : -magnitud;
      }

      if (delta === 0) {
        const actual = await tx.posExistencia.findUniqueOrThrow({ where: { sucursalId_productoId: { sucursalId, productoId: id } } });
        return actual.existencia;
      }

      return registrarMovimientoInventario(tx, {
        productoId: id,
        sucursalId,
        tipo,
        delta,
        detalle,
        usuarioId: sesion.id,
      });
    });

    return NextResponse.json({ ok: true, data: { existencia: existenciaResultado } });
  } catch (e) {
    if (e instanceof Error && (e.message === "nuevaExistencia requerida para un ajuste" || e.message === "La cantidad debe ser mayor a cero")) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
    return respuestaError(e, "Error al registrar movimiento de inventario");
  }
}
