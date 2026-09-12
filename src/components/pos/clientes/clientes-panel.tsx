"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonLista } from "@/components/ui/skeleton";
import { formatearMoneda } from "@/lib/formato";
import toast from "react-hot-toast";
import { ModalCliente } from "./modal-cliente";
import type { PosClienteT } from "@/lib/pos/tipos";
import { ETIQUETAS_TIPO_PRECIO_CLIENTE } from "@/lib/pos/constantes";

export function ClientesPanel() {
  const [clientes, setClientes] = useState<PosClienteT[]>([]);
  const [cargando, setCargando] = useState(true);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<{ cliente: PosClienteT | null } | null>(null);

  async function cargar() {
    setCargando(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/pos/clientes?${params.toString()}`);
    const json = await res.json();
    if (json.ok) setClientes(json.data);
    setCargando(false);
  }

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function eliminar(cliente: PosClienteT) {
    if (!confirm(`¿Eliminar a "${cliente.nombre}"?`)) return;
    const res = await fetch(`/api/pos/clientes/${cliente.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error ?? "Error al eliminar");
    toast.success("Cliente eliminado");
    cargar();
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-texto">Clientes</h1>
        <Boton icono={<Plus className="h-4 w-4" />} onClick={() => setModal({ cliente: null })}>Nuevo cliente</Boton>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-texto-suave" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o teléfono"
          className="w-full rounded-xl border border-borde bg-surface pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca/30"
        />
      </div>

      {cargando ? (
        <SkeletonLista filas={5} />
      ) : clientes.length === 0 ? (
        <EmptyState icono={<Users className="h-8 w-8" />} titulo="Sin clientes" descripcion="Da de alta clientes para ofrecerles crédito." />
      ) : (
        <div className="space-y-2">
          {clientes.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-borde bg-surface p-4">
              <Link href={`/pos/clientes/${c.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-texto truncate">{c.nombre}</div>
                  {c.tipoPrecio !== "VENTA" && <Badge variante="marca">{ETIQUETAS_TIPO_PRECIO_CLIENTE[c.tipoPrecio]}</Badge>}
                </div>
                <div className="text-xs text-texto-suave">{c.telefono ?? "sin teléfono"} · {c.direccion ?? "sin dirección"}</div>
              </Link>
              <div className="text-right">
                <div className="text-sm font-semibold text-texto">{formatearMoneda(c.saldoActual)} <span className="text-texto-muy-suave font-normal">/ {formatearMoneda(c.limiteCredito)}</span></div>
                {c.saldoActual > 0 && <Badge variante="advertencia">Con saldo</Badge>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModal({ cliente: c })} className="p-1.5 rounded-lg hover:bg-surface-hover text-texto-suave" title="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => eliminar(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-texto-suave hover:text-peligro" title="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ModalCliente cliente={modal.cliente} onCerrar={() => setModal(null)} onGuardado={() => { setModal(null); cargar(); }} />
      )}
    </div>
  );
}
