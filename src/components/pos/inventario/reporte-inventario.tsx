"use client";
import { useEffect, useState } from "react";
import { Download, Printer, Upload } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/badge";
import { SkeletonLista } from "@/components/ui/skeleton";
import { formatearMoneda } from "@/lib/formato";
import { ModalImportar } from "@/components/pos/productos/modal-importar";

interface Fila {
  id: string;
  nombre: string;
  departamento: string;
  unidad: string;
  existencia: number;
  existenciaMinima: number;
  bajaExistencia: boolean;
  precioCosto: number;
  precioVenta: number;
  valorCosto: number;
  valorVenta: number;
}

export function ReporteInventario({ puedeImportar }: { puedeImportar: boolean }) {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [totales, setTotales] = useState({ valorCosto: 0, valorVenta: 0, piezas: 0 });
  const [cargando, setCargando] = useState(true);
  const [modalImportar, setModalImportar] = useState(false);

  function cargar() {
    setCargando(true);
    fetch("/api/pos/reportes/inventario")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setFilas(json.data.filas);
          setTotales(json.data.totales);
        }
      })
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function exportarExcel() {
    const XLSX = await import("xlsx");
    const hoja = XLSX.utils.json_to_sheet(
      filas.map((f) => ({
        Producto: f.nombre,
        Departamento: f.departamento,
        Unidad: f.unidad,
        Existencia: f.existencia,
        "Existencia mínima": f.existenciaMinima,
        "Precio costo": f.precioCosto,
        "Precio venta": f.precioVenta,
        "Valor a costo": f.valorCosto,
        "Valor a venta": f.valorVenta,
      }))
    );
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Inventario");
    XLSX.writeFile(libro, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  if (cargando) return <SkeletonLista filas={6} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid grid-cols-3 gap-3 flex-1">
          <div className="rounded-xl border border-borde bg-surface p-3">
            <p className="text-xs text-texto-suave">Piezas totales</p>
            <p className="text-lg font-bold text-texto">{totales.piezas.toLocaleString("es-MX")}</p>
          </div>
          <div className="rounded-xl border border-borde bg-surface p-3">
            <p className="text-xs text-texto-suave">Valor a costo</p>
            <p className="text-lg font-bold text-texto">{formatearMoneda(totales.valorCosto)}</p>
          </div>
          <div className="rounded-xl border border-borde bg-surface p-3">
            <p className="text-xs text-texto-suave">Valor a venta</p>
            <p className="text-lg font-bold text-exito">{formatearMoneda(totales.valorVenta)}</p>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          {puedeImportar && (
            <Boton variante="secundario" icono={<Upload className="h-4 w-4" />} onClick={() => setModalImportar(true)}>Importar</Boton>
          )}
          <Boton variante="secundario" icono={<Download className="h-4 w-4" />} onClick={exportarExcel}>Excel</Boton>
          <Boton variante="secundario" icono={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Imprimir</Boton>
        </div>
      </div>

      {modalImportar && (
        <ModalImportar onCerrar={() => setModalImportar(false)} onImportado={cargar} />
      )}

      <div className="overflow-x-auto rounded-2xl border border-borde bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borde text-left text-texto-suave">
              <th className="p-3 font-medium">Producto</th>
              <th className="p-3 font-medium">Departamento</th>
              <th className="p-3 font-medium text-right">Existencia</th>
              <th className="p-3 font-medium text-right">Valor costo</th>
              <th className="p-3 font-medium text-right">Valor venta</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className="border-b border-borde last:border-0">
                <td className="p-3 font-medium text-texto">{f.nombre}</td>
                <td className="p-3 text-texto-suave">{f.departamento}</td>
                <td className="p-3 text-right">
                  {f.bajaExistencia ? <Badge variante="peligro">{f.existencia}</Badge> : f.existencia}
                </td>
                <td className="p-3 text-right">{formatearMoneda(f.valorCosto)}</td>
                <td className="p-3 text-right font-medium">{formatearMoneda(f.valorVenta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
