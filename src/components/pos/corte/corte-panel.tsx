"use client";
import { useEffect, useState } from "react";
import { Landmark, Lock } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonLista } from "@/components/ui/skeleton";
import { formatearMoneda, formatearFecha } from "@/lib/formato";
import toast from "react-hot-toast";
import { ResumenCorte } from "./resumen-corte";
import { ModalDetalleCorte } from "./modal-detalle-corte";
import type { PosCorteT } from "@/lib/pos/tipos";

interface TurnoActual {
  id: string;
  fondoInicial: number;
}

export function CortePanel() {
  const [turno, setTurno] = useState<TurnoActual | null | undefined>(undefined);
  const [cortes, setCortes] = useState<PosCorteT[]>([]);
  const [cargandoCortes, setCargandoCortes] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [corteRecien, setCorteRecien] = useState<PosCorteT | null>(null);
  const [corteAbierto, setCorteAbierto] = useState<string | null>(null);

  async function cargarTurno() {
    const res = await fetch("/api/pos/turno/actual");
    const json = await res.json();
    setTurno(json.ok ? json.data : null);
  }

  async function cargarCortes() {
    setCargandoCortes(true);
    const res = await fetch("/api/pos/corte");
    const json = await res.json();
    if (json.ok) setCortes(json.data);
    setCargandoCortes(false);
  }

  useEffect(() => { cargarTurno(); cargarCortes(); }, []);

  async function cerrarCaja() {
    if (!turno) return;
    if (!confirm("¿Generar el corte de caja y cerrar el turno? Esta acción no se puede deshacer.")) return;
    setCerrando(true);
    try {
      const res = await fetch(`/api/pos/turno/${turno.id}/cerrar`, { method: "POST" });
      const json = await res.json();
      if (!json.ok) return toast.error(json.error ?? "Error al cerrar la caja");
      toast.success("Corte de caja generado");
      setCorteRecien(json.data);
      setTurno(null);
      cargarCortes();
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-texto mb-6">Corte de caja</h1>

      {turno === undefined ? null : turno ? (
        <div className="rounded-2xl border border-borde bg-surface p-5 mb-8 space-y-4">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-marca" />
            <span className="font-medium text-texto">Caja abierta · Fondo inicial {formatearMoneda(turno.fondoInicial)}</span>
          </div>
          <p className="text-sm text-texto-suave">
            Al cerrar tu caja se generará el corte del día con el resumen de entradas, salidas, ventas totales y la ganancia real.
          </p>
          <Boton variante="peligro" icono={<Lock className="h-4 w-4" />} cargando={cerrando} onClick={cerrarCaja}>
            Cerrar caja y generar corte
          </Boton>
        </div>
      ) : (
        <div className="rounded-2xl border border-borde bg-surface p-5 mb-8 text-sm text-texto-suave">
          No tienes una caja abierta actualmente.
        </div>
      )}

      {corteRecien && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-texto-suave uppercase tracking-wide mb-3">Corte recién generado</h2>
          <ResumenCorte corte={corteRecien} />
        </div>
      )}

      <h2 className="text-sm font-semibold text-texto-suave uppercase tracking-wide mb-3">Histórico de cortes</h2>
      {cargandoCortes ? (
        <SkeletonLista filas={4} />
      ) : cortes.length === 0 ? (
        <EmptyState icono={<Landmark className="h-8 w-8" />} titulo="Sin cortes registrados" />
      ) : (
        <div className="space-y-2">
          {cortes.map((c) => (
            <button
              key={c.id}
              onClick={() => setCorteAbierto(c.id)}
              className="w-full flex items-center justify-between rounded-xl border border-borde bg-surface p-4 hover:border-marca transition-colors text-left"
            >
              <div>
                <div className="font-medium text-texto">{formatearFecha(c.fecha)}</div>
                <div className="text-xs text-texto-suave">Cerrado por {c.usuario.nombre}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-texto">{formatearMoneda(c.ventasTotales)}</div>
                <div className="text-xs text-exito">Ganancia: {formatearMoneda(c.gananciaReal)}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {corteAbierto && <ModalDetalleCorte corteId={corteAbierto} onCerrar={() => setCorteAbierto(null)} />}
    </div>
  );
}
