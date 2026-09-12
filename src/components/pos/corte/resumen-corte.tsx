import { useState } from "react";
import { Printer } from "lucide-react";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { formatearMoneda } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { imprimirCorteAutomatico } from "@/lib/pos/imprimir-corte";
import toast from "react-hot-toast";
import type { PosCorteT } from "@/lib/pos/tipos";

type ClaveMonto = "fondoInicial" | "totalEfectivo" | "totalTarjeta" | "totalTransferencia" | "totalCobroClientes" | "totalEntradasManuales" | "totalPagoProveedores" | "totalSalidas";

const ETIQUETAS_TIPO_MOVIMIENTO: Record<string, string> = {
  SALIDA: "Salida",
  PAGO_PROVEEDOR: "Pago a proveedor",
  ENTRADA_MANUAL: "Entrada manual",
};

const FILAS: { clave: ClaveMonto; etiqueta: string }[] = [
  { clave: "fondoInicial", etiqueta: "Fondo inicial" },
  { clave: "totalEfectivo", etiqueta: "Ventas de contado (efectivo)" },
  { clave: "totalTarjeta", etiqueta: "Ventas con tarjeta" },
  { clave: "totalTransferencia", etiqueta: "Ventas por transferencia" },
  { clave: "totalCobroClientes", etiqueta: "Cobro a clientes" },
  { clave: "totalEntradasManuales", etiqueta: "Entradas de efectivo" },
  { clave: "totalPagoProveedores", etiqueta: "Pagos a proveedores" },
  { clave: "totalSalidas", etiqueta: "Salidas de dinero" },
];

export function ResumenCorte({ corte }: { corte: PosCorteT }) {
  const [imprimiendo, setImprimiendo] = useState(false);

  async function imprimir() {
    setImprimiendo(true);
    try {
      const res = await fetch("/api/pos/config");
      const json = await res.json();
      if (!json.ok) return toast.error("No se pudo obtener la configuración del negocio");
      const config = json.data;
      const via = await imprimirCorteAutomatico(
        {
          fecha: corte.fecha,
          cerradoPor: corte.usuario.nombre,
          fondoInicial: corte.fondoInicial,
          totalEfectivo: corte.totalEfectivo,
          totalTarjeta: corte.totalTarjeta,
          totalTransferencia: corte.totalTransferencia,
          totalCobroClientes: corte.totalCobroClientes,
          totalEntradasManuales: corte.totalEntradasManuales,
          totalPagoProveedores: corte.totalPagoProveedores,
          totalSalidas: corte.totalSalidas,
          ventasTotales: corte.ventasTotales,
          gananciaReal: corte.gananciaReal,
          mostrarGanancia: corte.gananciaReal !== undefined,
          ventasPorDepartamento: corte.ventasPorDepartamento,
          movimientosDetalle: corte.movimientosDetalle,
          efectivoEsperado: corte.efectivoEsperado,
          config,
        },
        config.impresora
      );
      if (via === "navegador" && config.impresora) {
        toast("No se pudo conectar con QZ Tray, se abrió el diálogo de impresión.", { icon: "⚠️" });
      }
    } finally {
      setImprimiendo(false);
    }
  }

  return (
    <div className="space-y-4">
      <Boton variante="secundario" icono={<Printer className="h-4 w-4" />} cargando={imprimiendo} onClick={imprimir}>
        Imprimir corte
      </Boton>
      <div className="rounded-xl border border-borde divide-y divide-borde">
        {FILAS.map((f) => (
          <div key={f.clave} className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-texto-suave">{f.etiqueta}</span>
            <span className="font-medium text-texto">{formatearMoneda(corte[f.clave])}</span>
          </div>
        ))}
      </div>

      {corte.movimientosDetalle && corte.movimientosDetalle.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-texto-suave uppercase tracking-wide mb-2">Detalle de movimientos</h3>
          <div className="rounded-xl border border-borde divide-y divide-borde">
            {corte.movimientosDetalle.map((m, i) => (
              <div key={i} className="flex justify-between px-4 py-2.5 text-sm gap-3">
                <span className="text-texto-suave">
                  {ETIQUETAS_TIPO_MOVIMIENTO[m.tipo] ?? m.tipo}: {m.concepto}
                </span>
                <span className="font-medium text-texto whitespace-nowrap">{formatearMoneda(m.monto)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {corte.ventasPorDepartamento && corte.ventasPorDepartamento.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-texto-suave uppercase tracking-wide mb-2">Ventas por departamento</h3>
          <div className="rounded-xl border border-borde divide-y divide-borde">
            {corte.ventasPorDepartamento.map((d) => (
              <div key={d.departamento} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-texto-suave">{d.departamento}</span>
                <span className="font-medium text-texto">{formatearMoneda(d.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cn("grid gap-3", corte.gananciaReal !== undefined ? "grid-cols-2" : "grid-cols-1")}>
        <Tarjeta padding="md">
          <p className="text-xs text-texto-suave">Ventas totales del día</p>
          <p className="text-xl font-bold text-texto">{formatearMoneda(corte.ventasTotales)}</p>
        </Tarjeta>
        {corte.gananciaReal !== undefined && (
          <Tarjeta padding="md">
            <p className="text-xs text-texto-suave">Ganancia real del día</p>
            <p className="text-xl font-bold text-exito">{formatearMoneda(corte.gananciaReal)}</p>
          </Tarjeta>
        )}
      </div>

      <Tarjeta padding="md" className="bg-marca-suave border-marca/20">
        <p className="text-xs text-marca">Efectivo esperado en caja</p>
        <p className="text-xl font-bold text-marca">{formatearMoneda(corte.efectivoEsperado)}</p>
      </Tarjeta>
    </div>
  );
}
