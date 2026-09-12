"use client";
import { useEffect, useState } from "react";
import { Landmark, Lock, UserCog } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/campo";
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
  usuarioId: string;
  sucursalId: string;
}

interface UsuarioPos {
  id: string;
  nombre: string;
  usuario: string;
  rol: "ADMINISTRADOR" | "CAJERO";
  sucursalId: string | null;
  activo: boolean;
}

function esHoy(fechaISO: string): boolean {
  const f = new Date(fechaISO);
  const hoy = new Date();
  return f.getFullYear() === hoy.getFullYear() && f.getMonth() === hoy.getMonth() && f.getDate() === hoy.getDate();
}

const CAMPOS_RESUMEN_DIA = [
  { clave: "totalEfectivo", etiqueta: "Ventas de contado (efectivo)" },
  { clave: "totalTarjeta", etiqueta: "Ventas con tarjeta" },
  { clave: "totalTransferencia", etiqueta: "Ventas por transferencia" },
  { clave: "totalCobroClientes", etiqueta: "Cobro a clientes" },
  { clave: "totalEntradasManuales", etiqueta: "Entradas de efectivo" },
  { clave: "totalPagoProveedores", etiqueta: "Pagos a proveedores" },
  { clave: "totalSalidas", etiqueta: "Salidas de dinero" },
] as const;

export function CortePanel({ esAdmin }: { esAdmin: boolean }) {
  const [turno, setTurno] = useState<TurnoActual | null | undefined>(undefined);
  const [cortes, setCortes] = useState<PosCorteT[]>([]);
  const [cargandoCortes, setCargandoCortes] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [corteRecien, setCorteRecien] = useState<PosCorteT | null>(null);
  const [corteAbierto, setCorteAbierto] = useState<string | null>(null);
  const [modalReasignar, setModalReasignar] = useState(false);

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

  const cortesHoy = cortes.filter((c) => esHoy(c.fecha));
  const resumenHoy = cortesHoy.reduce(
    (acc, c) => ({
      totalEfectivo: acc.totalEfectivo + c.totalEfectivo,
      totalTarjeta: acc.totalTarjeta + c.totalTarjeta,
      totalTransferencia: acc.totalTransferencia + c.totalTransferencia,
      totalCobroClientes: acc.totalCobroClientes + c.totalCobroClientes,
      totalEntradasManuales: acc.totalEntradasManuales + c.totalEntradasManuales,
      totalPagoProveedores: acc.totalPagoProveedores + c.totalPagoProveedores,
      totalSalidas: acc.totalSalidas + c.totalSalidas,
      ventasTotales: acc.ventasTotales + c.ventasTotales,
      gananciaReal: acc.gananciaReal + (c.gananciaReal ?? 0),
    }),
    {
      totalEfectivo: 0, totalTarjeta: 0, totalTransferencia: 0, totalCobroClientes: 0,
      totalEntradasManuales: 0, totalPagoProveedores: 0, totalSalidas: 0, ventasTotales: 0, gananciaReal: 0,
    }
  );

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
          <div className="flex flex-wrap gap-2">
            <Boton variante="peligro" icono={<Lock className="h-4 w-4" />} cargando={cerrando} onClick={cerrarCaja}>
              Cerrar caja y generar corte
            </Boton>
            {esAdmin && (
              <Boton variante="secundario" icono={<UserCog className="h-4 w-4" />} onClick={() => setModalReasignar(true)}>
                Reasignar caja
              </Boton>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-borde bg-surface p-5 mb-8 text-sm text-texto-suave">
          No tienes una caja abierta actualmente.
        </div>
      )}

      {esAdmin && !cargandoCortes && cortesHoy.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-texto-suave uppercase tracking-wide mb-1">Resumen del día de hoy</h2>
          <p className="text-xs text-texto-muy-suave mb-3">
            Suma de los {cortesHoy.length} corte{cortesHoy.length === 1 ? "" : "s"} cerrado{cortesHoy.length === 1 ? "" : "s"} hoy en esta sucursal
            ({cortesHoy.map((c) => c.usuario.nombre).join(", ")}) — útil aunque la caja se haya abierto y cerrado varias veces en el día.
          </p>
          <div className="rounded-xl border border-borde divide-y divide-borde mb-3">
            {CAMPOS_RESUMEN_DIA.map((f) => (
              <div key={f.clave} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-texto-suave">{f.etiqueta}</span>
                <span className="font-medium text-texto">{formatearMoneda(resumenHoy[f.clave])}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-borde bg-surface p-4">
              <p className="text-xs text-texto-suave">Ventas totales de hoy</p>
              <p className="text-xl font-bold text-texto">{formatearMoneda(resumenHoy.ventasTotales)}</p>
            </div>
            <div className="rounded-xl border border-borde bg-surface p-4">
              <p className="text-xs text-texto-suave">Ganancia real de hoy</p>
              <p className="text-xl font-bold text-exito">{formatearMoneda(resumenHoy.gananciaReal)}</p>
            </div>
          </div>
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
                {c.gananciaReal !== undefined && (
                  <div className="text-xs text-exito">Ganancia: {formatearMoneda(c.gananciaReal)}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {corteAbierto && <ModalDetalleCorte corteId={corteAbierto} onCerrar={() => setCorteAbierto(null)} />}
      {modalReasignar && turno && (
        <ModalReasignarCaja
          turno={turno}
          onCerrar={() => setModalReasignar(false)}
          onReasignado={() => { setModalReasignar(false); cargarTurno(); }}
        />
      )}
    </div>
  );
}

function ModalReasignarCaja({
  turno,
  onCerrar,
  onReasignado,
}: {
  turno: TurnoActual;
  onCerrar: () => void;
  onReasignado: () => void;
}) {
  const [usuarios, setUsuarios] = useState<UsuarioPos[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioId, setUsuarioId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/pos/usuarios")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          const elegibles = (json.data as UsuarioPos[]).filter(
            (u) => u.sucursalId === turno.sucursalId && u.activo && u.id !== turno.usuarioId
          );
          setUsuarios(elegibles);
          if (elegibles.length > 0) setUsuarioId(elegibles[0].id);
        }
      })
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reasignar() {
    if (!usuarioId) return;
    setEnviando(true);
    setError("");
    try {
      const res = await fetch(`/api/pos/turno/${turno.id}/reasignar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Error al reasignar la caja");
        return;
      }
      toast.success("Caja reasignada");
      onReasignado();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Reasignar caja">
      <div className="space-y-4">
        <p className="text-sm text-texto-suave">
          El turno seguirá abierto, pero pasará a nombre de la persona que elijas — será quien pueda hacer el corte al final del día.
        </p>
        {cargando ? (
          <p className="text-sm text-texto-suave">Cargando…</p>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-texto-suave">No hay otro usuario activo en esta sucursal para reasignar la caja.</p>
        ) : (
          <Select
            label="Reasignar a"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            opciones={usuarios.map((u) => ({ valor: u.id, etiqueta: `${u.nombre} (${u.rol === "ADMINISTRADOR" ? "Administrador" : "Cajero"})` }))}
          />
        )}
        {error && <p className="text-sm text-peligro">{error}</p>}
        <div className="flex gap-2">
          <Boton type="button" variante="secundario" className="flex-1" onClick={onCerrar}>Cancelar</Boton>
          <Boton
            type="button"
            variante="primario"
            className="flex-1"
            disabled={usuarios.length === 0}
            cargando={enviando}
            onClick={reasignar}
          >
            Reasignar
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
