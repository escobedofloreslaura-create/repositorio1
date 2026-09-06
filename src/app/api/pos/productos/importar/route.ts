import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requerirAdminPos } from "@/lib/pos/auth";
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
    const sesion = await requerirAdminPos();

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

      const precioCosto = Number(fila.precioCosto) || 0;
      const precioVenta = Number(fila.precioVenta) || 0;
      const precioMayoreo = fila.precioMayoreo ? Number(fila.precioMayoreo) : null;
      const existenciaMinima = fila.existenciaMinima !== undefined && fila.existenciaMinima !== "" ? Number(fila.existenciaMinima) : 5;
      const existencia = Number(fila.existencia) || 0;
      const unidad = String(fila.unidad ?? "PIEZA").trim().toUpperCase() === "CAJA" ? "CAJA" : "PIEZA";

      try {
        await prisma.$transaction(async (tx) => {
          const existente = codigoBarras
            ? await tx.posProducto.findUnique({ where: { codigoBarras } })
            : await tx.posProducto.findFirst({ where: { nombre } });

          if (existente) {
            await tx.posProducto.update({
              where: { id: existente.id },
              data: {
                nombre,
                departamentoId: departamento.id,
                unidad,
                precioCosto,
                precioVenta,
                precioMayoreo,
                existenciaMinima,
              },
            });
            const delta = existencia - existente.existencia;
            if (delta !== 0) {
              await registrarMovimientoInventario(tx, {
                productoId: existente.id,
                tipo: "AJUSTE",
                delta,
                detalle: "Ajuste por importación masiva de catálogo",
                usuarioId: sesion.id,
              });
            }
            actualizados++;
          } else {
            const creado = await tx.posProducto.create({
              data: {
                nombre,
                codigoBarras,
                departamentoId: departamento.id,
                unidad,
                precioCosto,
                precioVenta,
                precioMayoreo,
                existencia: 0,
                existenciaMinima,
              },
            });
            if (existencia > 0) {
              await registrarMovimientoInventario(tx, {
                productoId: creado.id,
                tipo: "ENTRADA",
                delta: existencia,
                detalle: "Existencia inicial por importación masiva de catálogo",
                usuarioId: sesion.id,
              });
            }
            creados++;
          }
        });
      } catch {
        errores.push(`Fila ${i + 2}: no se pudo guardar "${nombre}"`);
      }
    }

    return NextResponse.json({ ok: true, data: { creados, actualizados, errores, total: filas.length } });
  } catch (e) {
    return respuestaError(e, "Error al importar el catálogo");
  }
}
