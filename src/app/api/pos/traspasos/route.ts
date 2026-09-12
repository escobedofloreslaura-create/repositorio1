import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirAdminGeneral } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";
import { registrarMovimientoInventario } from "@/lib/pos/kardex";

// Traspaso de mercancía entre sucursales: exclusivo del Administrador
// General. Resta existencia en el origen, suma en el destino y deja kardex
// en ambas.
export async function GET(req: NextRequest) {
  try {
    await requerirAdminGeneral();
    const { searchParams } = new URL(req.url);
    const productoId = searchParams.get("productoId");

    const traspasos = await prisma.posTraspaso.findMany({
      where: { ...(productoId ? { productoId } : {}) },
      include: {
        producto: { select: { nombre: true } },
        sucursalOrigen: { select: { nombre: true } },
        sucursalDestino: { select: { nombre: true } },
        usuario: { select: { nombre: true } },
      },
      orderBy: { creadoEn: "desc" },
      take: 200,
    });

    return NextResponse.json({ ok: true, data: traspasos });
  } catch (e) {
    return respuestaError(e, "Error al obtener traspasos");
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await requerirAdminGeneral();
    const { productoId, sucursalOrigenId, sucursalDestinoId, cantidad, motivo } = await req.json();

    const cantidadNum = Number(cantidad);
    if (!cantidadNum || cantidadNum <= 0) {
      return NextResponse.json({ ok: false, error: "La cantidad debe ser mayor a cero" }, { status: 400 });
    }
    if (!sucursalOrigenId || !sucursalDestinoId) {
      return NextResponse.json({ ok: false, error: "Selecciona la sucursal de origen y destino" }, { status: 400 });
    }
    if (sucursalOrigenId === sucursalDestinoId) {
      return NextResponse.json({ ok: false, error: "El origen y el destino no pueden ser la misma sucursal" }, { status: 400 });
    }

    const traspaso = await prisma.$transaction(async (tx) => {
      await registrarMovimientoInventario(tx, {
        productoId,
        sucursalId: sucursalOrigenId,
        tipo: "TRASPASO_SALIDA",
        delta: -cantidadNum,
        detalle: motivo || "Traspaso entre sucursales",
        usuarioId: sesion.id,
      });

      await registrarMovimientoInventario(tx, {
        productoId,
        sucursalId: sucursalDestinoId,
        tipo: "TRASPASO_ENTRADA",
        delta: cantidadNum,
        detalle: motivo || "Traspaso entre sucursales",
        usuarioId: sesion.id,
      });

      return tx.posTraspaso.create({
        data: {
          productoId,
          sucursalOrigenId,
          sucursalDestinoId,
          cantidad: cantidadNum,
          motivo: motivo || null,
          usuarioId: sesion.id,
        },
        include: {
          producto: { select: { nombre: true } },
          sucursalOrigen: { select: { nombre: true } },
          sucursalDestino: { select: { nombre: true } },
        },
      });
    });

    return NextResponse.json({ ok: true, data: traspaso });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("STOCK_INSUFICIENTE:")) {
      return NextResponse.json({ ok: false, error: `Existencia insuficiente de "${e.message.split(":")[1]}" en la sucursal de origen` }, { status: 409 });
    }
    return respuestaError(e, "Error al registrar el traspaso");
  }
}
