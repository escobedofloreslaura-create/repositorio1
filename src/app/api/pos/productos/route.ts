import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, requerirAdminGeneral, obtenerSucursalActiva, esAdminGeneral } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";
import { registrarMovimientoInventario } from "@/lib/pos/kardex";

// El catálogo (nombre, precios) es único para toda la cadena. La existencia
// que se muestra es la de la sucursal en la que el usuario está operando.
export async function GET(req: NextRequest) {
  try {
    const sesion = await requerirSesionPos();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const departamentoId = searchParams.get("departamentoId");
    const bajaExistencia = searchParams.get("bajaExistencia") === "1";
    const soloActivos = searchParams.get("todos") !== "1";
    const todasSucursales = searchParams.get("todasSucursales") === "1" && esAdminGeneral(sesion);

    const sucursalId = await obtenerSucursalActiva(sesion);

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
      include: {
        departamento: true,
        existencias: todasSucursales
          ? { include: { sucursal: { select: { id: true, nombre: true } } } }
          : { where: { sucursalId: sucursalId ?? "" } },
      },
      orderBy: { nombre: "asc" },
    });

    const conExistencia = productos.map((p) => {
      const propia = p.existencias.find((e) => "sucursalId" in e && e.sucursalId === sucursalId);
      const base = {
        ...p,
        existencia: propia?.existencia ?? 0,
        existenciaMinima: propia?.existenciaMinima ?? 5,
      };
      if (todasSucursales) {
        return {
          ...base,
          existenciasPorSucursal: p.existencias.map((e) => ({
            sucursalId: e.sucursalId,
            sucursalNombre: (e as unknown as { sucursal: { nombre: string } }).sucursal.nombre,
            existencia: e.existencia,
          })),
        };
      }
      return base;
    });

    const filtrados = bajaExistencia
      ? conExistencia.filter((p) => p.existencia <= p.existenciaMinima)
      : conExistencia;

    return NextResponse.json({ ok: true, data: filtrados });
  } catch (e) {
    return respuestaError(e, "Error al obtener productos");
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await requerirAdminGeneral();
    const body = await req.json();
    const { nombre, codigoBarras, departamentoId, unidad, precioCosto, precioVenta, precioMayoreo, existencia, existenciaMinima } = body;

    if (!nombre || !departamentoId) {
      return NextResponse.json({ ok: false, error: "Nombre y departamento son requeridos" }, { status: 400 });
    }

    const sucursalId: string | undefined = body.sucursalId || (await obtenerSucursalActiva(sesion)) || undefined;

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
        },
      });

      if (sucursalId) {
        await tx.posExistencia.create({
          data: { sucursalId, productoId: creado.id, existenciaMinima: Number(existenciaMinima) || 5 },
        });

        const existenciaInicial = Number(existencia) || 0;
        if (existenciaInicial > 0) {
          await registrarMovimientoInventario(tx, {
            productoId: creado.id,
            sucursalId,
            tipo: "ENTRADA",
            delta: existenciaInicial,
            detalle: "Existencia inicial al dar de alta el producto",
            usuarioId: sesion.id,
          });
        }
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
