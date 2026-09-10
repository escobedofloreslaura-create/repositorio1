import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requerirAdminGeneral, obtenerSucursalActiva } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";
import { registrarMovimientoInventario } from "@/lib/pos/kardex";

interface FilaImportada {
  nombre?: string;
  codigoBarras?: string;
  departamento?: string;
  unidad?: string;
  precioCosto?: string | number;
  precioVenta?: string | number;
  precioMayoreo?: string | number;
  precioClienteFrecuente?: string | number;
  existencia?: string | number;
  existenciaMinima?: string | number;
}

function normalizarClave(clave: string): string {
  const k = clave.trim().toLowerCase();
  const mapa: Record<string, string> = {
    "nombre": "nombre",
    "descripcion": "nombre",
    "descripción": "nombre",
    "codigo": "codigoBarras",
    "código": "codigoBarras",
    "codigobarras": "codigoBarras",
    "código de barras": "codigoBarras",
    "codigo de barras": "codigoBarras",
    "departamento": "departamento",
    "unidad": "unidad",
    "preciocosto": "precioCosto",
    "precio costo": "precioCosto",
    "precioventa": "precioVenta",
    "precio venta": "precioVenta",
    "preciomayoreo": "precioMayoreo",
    "precio mayoreo": "precioMayoreo",
    "precioclientefrecuente": "precioClienteFrecuente",
    "precio cliente frecuente": "precioClienteFrecuente",
    "cliente frecuente": "precioClienteFrecuente",
    "existencia": "existencia",
    "existenciaminima": "existenciaMinima",
    "existencia minima": "existenciaMinima",
    "existencia mínima": "existenciaMinima",
  };
  return mapa[k] ?? clave;
}

function normalizarFila(fila: Record<string, unknown>): FilaImportada {
  const normalizada: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(fila)) {
    normalizada[normalizarClave(clave)] = valor;
  }
  return normalizada as FilaImportada;
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await requerirAdminGeneral();
    const sucursalId = await obtenerSucursalActiva(sesion);
    if (!sucursalId) {
      return NextResponse.json({ ok: false, error: "No hay ninguna sucursal creada todavía" }, { status: 409 });
    }

    const formData = await req.formData();
    const archivo = formData.get("archivo") as File | null;
    if (!archivo) {
      return NextResponse.json({ ok: false, error: "No se recibió ningún archivo" }, { status: 400 });
    }

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const esCsv = archivo.name.toLowerCase().endsWith(".csv");

    let filas: Record<string, unknown>[] = [];
    if (esCsv) {
      const texto = buffer.toString("utf-8");
      const resultado = Papa.parse<Record<string, unknown>>(texto, { header: true, skipEmptyLines: true });
      filas = resultado.data;
    } else {
      const libro = XLSX.read(buffer, { type: "buffer" });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      filas = XLSX.utils.sheet_to_json(hoja, { defval: "" });
    }

    const departamentos = await prisma.posDepartamento.findMany();
    const departamentoPorNombre = new Map(departamentos.map((d) => [d.nombre.toLowerCase().trim(), d]));
    const departamentoDefault = departamentos[0];

    let creados = 0;
    let actualizados = 0;
    const errores: string[] = [];

    for (const [i, filaCruda] of filas.entries()) {
      const fila = normalizarFila(filaCruda);
      const nombre = String(fila.nombre ?? "").trim();
      if (!nombre) {
        errores.push(`Fila ${i + 2}: falta el nombre del producto`);
        continue;
      }

      const codigoBarras = fila.codigoBarras ? String(fila.codigoBarras).trim() : null;
      const departamentoNombre = fila.departamento ? String(fila.departamento).trim() : "";
      const departamento = departamentoPorNombre.get(departamentoNombre.toLowerCase()) ?? departamentoDefault;

      if (!departamento) {
        errores.push(`Fila ${i + 2}: no hay departamentos configurados`);
        continue;
      }

      // Las columnas de precio, unidad y existencia mínima son opcionales al
      // actualizar un producto existente (por ejemplo, un archivo que solo
      // trae el conteo físico de inventario): si no vienen en la fila, no se
      // tocan. Para un producto nuevo sí se requieren costo y venta.
      const tieneCosto = fila.precioCosto !== undefined && String(fila.precioCosto).trim() !== "";
      const tieneVenta = fila.precioVenta !== undefined && String(fila.precioVenta).trim() !== "";
      const tieneMayoreo = fila.precioMayoreo !== undefined && String(fila.precioMayoreo).trim() !== "";
      const tieneClienteFrecuente = fila.precioClienteFrecuente !== undefined && String(fila.precioClienteFrecuente).trim() !== "";
      const tieneUnidad = fila.unidad !== undefined && String(fila.unidad).trim() !== "";
      const tieneExistenciaMinima = fila.existenciaMinima !== undefined && String(fila.existenciaMinima).trim() !== "";
      const tieneExistencia = fila.existencia !== undefined && String(fila.existencia).trim() !== "";

      const unidad = tieneUnidad ? (String(fila.unidad).trim().toUpperCase() === "CAJA" ? "CAJA" : "PIEZA") : undefined;
      const existenciaMinima = tieneExistenciaMinima ? Number(fila.existenciaMinima) : undefined;
      const existencia = tieneExistencia ? Number(fila.existencia) || 0 : undefined;

      try {
        await prisma.$transaction(async (tx) => {
          const existente = codigoBarras
            ? await tx.posProducto.findUnique({ where: { codigoBarras } })
            : await tx.posProducto.findFirst({ where: { nombre } });

          let productoId: string;
          if (existente) {
            productoId = existente.id;
            await tx.posProducto.update({
              where: { id: existente.id },
              data: {
                nombre,
                departamentoId: departamento.id,
                ...(unidad ? { unidad } : {}),
                ...(tieneCosto ? { precioCosto: Number(fila.precioCosto) || 0 } : {}),
                ...(tieneVenta ? { precioVenta: Number(fila.precioVenta) || 0 } : {}),
                ...(tieneMayoreo ? { precioMayoreo: Number(fila.precioMayoreo) } : {}),
                ...(tieneClienteFrecuente ? { precioClienteFrecuente: Number(fila.precioClienteFrecuente) } : {}),
              },
            });
          } else {
            if (!tieneCosto || !tieneVenta) throw new Error("FALTAN_PRECIOS");
            productoId = (
              await tx.posProducto.create({
                data: {
                  nombre,
                  codigoBarras,
                  departamentoId: departamento.id,
                  unidad: unidad ?? "PIEZA",
                  precioCosto: Number(fila.precioCosto) || 0,
                  precioVenta: Number(fila.precioVenta) || 0,
                  precioMayoreo: tieneMayoreo ? Number(fila.precioMayoreo) : null,
                  precioClienteFrecuente: tieneClienteFrecuente ? Number(fila.precioClienteFrecuente) : null,
                },
              })
            ).id;
          }

          const existenciaActual = await tx.posExistencia.upsert({
            where: { sucursalId_productoId: { sucursalId, productoId } },
            update: existenciaMinima !== undefined ? { existenciaMinima } : {},
            create: { sucursalId, productoId, existenciaMinima: existenciaMinima ?? 5 },
          });

          if (existencia !== undefined) {
            const delta = existencia - existenciaActual.existencia;
            if (delta !== 0) {
              await registrarMovimientoInventario(tx, {
                productoId,
                sucursalId,
                tipo: existente ? "AJUSTE" : "ENTRADA",
                delta,
                detalle: existente ? "Ajuste por importación masiva de inventario" : "Existencia inicial por importación masiva de inventario",
                usuarioId: sesion.id,
              });
            }
          }

          if (existente) actualizados++;
          else creados++;
        });
      } catch (e) {
        if (e instanceof Error && e.message === "FALTAN_PRECIOS") {
          errores.push(`Fila ${i + 2}: "${nombre}" es un producto nuevo y le falta precio costo o precio venta`);
        } else {
          errores.push(`Fila ${i + 2}: no se pudo guardar "${nombre}"`);
        }
      }
    }

    return NextResponse.json({ ok: true, data: { creados, actualizados, errores, total: filas.length } });
  } catch (e) {
    return respuestaError(e, "Error al importar el catálogo");
  }
}
