import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, requerirAdminPos } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";
import { registrarMovimientoInventario } from "@/lib/pos/kardex";

export async function GET(req: NextRequest) {
  try {
    await requerirSesionPos();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const departamentoId = searchParams.get("departamentoId");
    const bajaExistencia = searchParams.get("bajaExistencia") === "1";
    const soloActivos = searchParams.get("todos") !== "1";

    const productos = await prisma.posProducto.findMany({
      where: {
        ...(soloActivos ? { activo: true } : {}),
        ...(departamentoId ? { departamentoId } : {}),
        ...(q
          ? {
              OR: [
                { nombre: { contains: q } },
                { codigoBarras: { contains: q } },
              ],
            }
          : {}),
      },
      include: { departamento: true },
      orderBy: { nombre: "asc" },
    });

    const filtrados = bajaExistencia
      ? productos.filter((p) => p.existencia <= p.existenciaMinima)
      : productos;

    return NextResponse.json({ ok: true, data: filtrados });
  } catch (e) {
    return respuestaError(e, "Error al obtener productos");
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await requerirAdminPos();
    const body = await req.json();
    const { nombre, codigoBarras, departamentoId, unidad, precioCosto, precioVenta, precioMayoreo, existencia, existenciaMinima } = body;

    if (!nombre || !departamentoId) {
      return NextResponse.json({ ok: false, error: "Nombre y departamento son requeridos" }, { status: 400 });
    }

    const producto = await prisma.$transaction(async (tx) => {
      const creado = await tx.posProducto.create({
        data: {
          nombre,
          codigoBarras: codigoBarras || null,
          departamentoId,
          unidad: unidad || "PIEZA",
          precioCosto: Number(precioCosto) || 0,
          precioVenta: Number(precioVenta) || 0,
          precioMayoreo: precioMayoreo ? Number(precioMayoreo) : null,
          existencia: 0,
          existenciaMinima: Number(existenciaMinima) || 5,
        },
      });

      const existenciaInicial = Number(existencia) || 0;
      if (existenciaInicial > 0) {
        await registrarMovimientoInventario(tx, {
          productoId: creado.id,
          tipo: "ENTRADA",
          delta: existenciaInicial,
          detalle: "Existencia inicial al dar de alta el producto",
          usuarioId: sesion.id,
        });
      }

      return tx.posProducto.findUniqueOrThrow({ where: { id: creado.id }, include: { departamento: true } });
    });

    return NextResponse.json({ ok: true, data: producto });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return NextResponse.json({ ok: false, error: "Ya existe un producto con ese código de barras" }, { status: 409 });
    }
    return respuestaError(e, "Error al crear producto");
  }
}
