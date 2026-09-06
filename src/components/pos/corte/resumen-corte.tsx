import { Tarjeta } from "@/components/ui/tarjeta";
import { formatearMoneda } from "@/lib/formato";
import type { PosCorteT } from "@/lib/pos/tipos";

type ClaveMonto = "fondoInicial" | "totalEfectivo" | "totalTarjeta" | "totalTransferencia" | "totalCobroClientes" | "totalEntradasManuales" | "totalPagoProveedores" | "totalSalidas";

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
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-borde divide-y divide-borde">
        {FILAS.map((f) => (
          <div key={f.clave} className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-texto-suave">{f.etiqueta}</span>
            <span className="font-medium text-texto">{formatearMoneda(corte[f.clave])}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tarjeta padding="md">
          <p className="text-xs text-texto-suave">Ventas totales del día</p>
          <p className="text-xl font-bold text-texto">{formatearMoneda(corte.ventasTotales)}</p>
        </Tarjeta>
        <Tarjeta padding="md">
          <p className="text-xs text-texto-suave">Ganancia real del día</p>
          <p className="text-xl font-bold text-exito">{formatearMoneda(corte.gananciaReal)}</p>
        </Tarjeta>
      </div>

      <Tarjeta padding="md" className="bg-marca-suave border-marca/20">
        <p className="text-xs text-marca">Efectivo esperado en caja</p>
        <p className="text-xl font-bold text-marca">{formatearMoneda(corte.efectivoEsperado)}</p>
      </Tarjeta>
    </div>
  );
}
