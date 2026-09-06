"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { SkeletonLista } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatearFechaHumana } from "@/lib/formato";
import { ClipboardList } from "lucide-react";

interface Movimiento {
  id: string;
  tipo: string;
  cantidad: number;
  existenciaAnterior: number;
  existenciaNueva: number;
  detalle: string | null;
  creadoEn: string;
  producto: { nombre: string; codigoBarras: string | null };
  usuario: { nombre: string };
}

const COLOR_TIPO: Record<string, "exito" | "peligro" | "advertencia" | "neutro"> = {
  ENTRADA: "exito",
  DEVOLUCION: "exito",
  CANCELACION: "exito",
  SALIDA: "peligro",
  VENTA: "peligro",
  AJUSTE: "advertencia",
};

export function KardexPanel() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/pos/reportes/kardex")
      .then((r) => r.json())
      .then((json) => { if (json.ok) setMovimientos(json.data); })
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <SkeletonLista filas={6} />;
  if (movimientos.length === 0) return <EmptyState icono={<ClipboardList className="h-8 w-8" />} titulo="Sin movimientos registrados" />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-borde bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-borde text-left text-texto-suave">
            <th className="p-3 font-medium">Fecha</th>
            <th className="p-3 font-medium">Producto</th>
            <th className="p-3 font-medium">Tipo</th>
            <th className="p-3 font-medium text-right">Cantidad</th>
            <th className="p-3 font-medium text-right">Existencia</th>
            <th className="p-3 font-medium">Usuario</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) => (
            <tr key={m.id} className="border-b border-borde last:border-0">
              <td className="p-3 whitespace-nowrap text-texto-suave">{formatearFechaHumana(m.creadoEn)}</td>
              <td className="p-3 font-medium text-texto">{m.producto.nombre}</td>
              <td className="p-3"><Badge variante={COLOR_TIPO[m.tipo] ?? "neutro"}>{m.tipo}</Badge></td>
              <td className="p-3 text-right">{m.cantidad}</td>
              <td className="p-3 text-right text-texto-suave">{m.existenciaAnterior} → {m.existenciaNueva}</td>
              <td className="p-3 text-texto-suave">{m.usuario.nombre}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
