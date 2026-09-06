"use client";
import { useEffect, useState } from "react";
import { Receipt, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonLista } from "@/components/ui/skeleton";
import { formatearMoneda, formatearFechaHumana } from "@/lib/formato";
import { ModalDetalleVenta } from "./modal-detalle-venta";

interface VentaResumen {
  id: string;
  folio: number;
  fecha: string;
  total: number;
  estado: string;
  cliente: { nombre: string } | null;
  usuario: { nombre: string };
  pagos: { forma: string }[];
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function HistoricoPanel() {
  const [ventas, setVentas] = useState<VentaResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState(hoyISO());
  const [ventaAbierta, setVentaAbierta] = useState<string | null>(null);

  async function cargar() {
    setCargando(true);
    const params = new URLSearchParams({ desde: `${desde}T00:00:00`, hasta: `${hasta}T23:59:59` });
    const res = await fetch(`/api/pos/ventas?${params.toString()}`);
    const json = await res.json();
    if (json.ok) setVentas(json.data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [desde, hasta]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalDia = ventas.filter((v) => v.estado === "COMPLETADA").reduce((a, v) => a + v.total, 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-texto mb-6">Histórico de ventas</h1>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="text-xs text-texto-suave block mb-1">Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-xl border border-borde px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-texto-suave block mb-1">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-xl border border-borde px-3 py-2 text-sm" />
        </div>
        <button onClick={() => { setDesde(hoyISO()); setHasta(hoyISO()); }} className="text-sm text-marca font-medium">Hoy</button>
        <div className="ml-auto text-right">
          <div className="text-xs text-texto-suave">Total del periodo</div>
          <div className="text-lg font-bold text-texto">{formatearMoneda(totalDia)}</div>
        </div>
      </div>

      {cargando ? (
        <SkeletonLista filas={6} />
      ) : ventas.length === 0 ? (
        <EmptyState icono={<Search className="h-8 w-8" />} titulo="Sin ventas en este periodo" />
      ) : (
        <div className="space-y-2">
          {ventas.map((v) => (
            <button
              key={v.id}
              onClick={() => setVentaAbierta(v.id)}
              className="w-full flex items-center gap-3 rounded-xl border border-borde bg-surface p-4 hover:border-marca transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-full bg-marca-suave text-marca flex items-center justify-center flex-shrink-0">
                <Receipt className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-texto">Venta #{v.folio} {v.cliente && `· ${v.cliente.nombre}`}</div>
                <div className="text-xs text-texto-suave">{formatearFechaHumana(v.fecha)} · {v.usuario.nombre}</div>
              </div>
              <Badge variante={v.estado === "CANCELADA" ? "peligro" : "neutro"}>{v.estado}</Badge>
              <span className="font-semibold text-texto w-24 text-right">{formatearMoneda(v.total)}</span>
            </button>
          ))}
        </div>
      )}

      {ventaAbierta && (
        <ModalDetalleVenta ventaId={ventaAbierta} onCerrar={() => setVentaAbierta(null)} onCambio={cargar} />
      )}
    </div>
  );
}
