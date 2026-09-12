"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Store, EyeOff, Eye } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonLista } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import { ModalSucursal } from "./modal-sucursal";
import type { PosSucursalT } from "@/lib/pos/tipos";

export function SucursalesPanel() {
  const [sucursales, setSucursales] = useState<PosSucursalT[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState<{ sucursal: PosSucursalT | null } | null>(null);

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/pos/sucursales");
    const json = await res.json();
    if (json.ok) setSucursales(json.data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  async function alternarActiva(s: PosSucursalT) {
    const res = await fetch(`/api/pos/sucursales/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !s.activa }),
    });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error ?? "Error");
    toast.success(s.activa ? "Sucursal desactivada" : "Sucursal activada");
    cargar();
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-xl font-bold text-texto">Sucursales</h1>
        <Boton icono={<Plus className="h-4 w-4" />} onClick={() => setModal({ sucursal: null })}>Nueva sucursal</Boton>
      </div>
      <p className="text-sm text-texto-suave mb-6">
        Cada sucursal tiene su propio inventario, cajeros, corte de caja y clientes. El catálogo y los precios son los mismos en todas.
      </p>

      {cargando ? (
        <SkeletonLista filas={3} />
      ) : sucursales.length === 0 ? (
        <EmptyState icono={<Store className="h-8 w-8" />} titulo="Sin sucursales" descripcion="Crea tu primera sucursal para empezar a operar." />
      ) : (
        <div className="space-y-2">
          {sucursales.map((s) => (
            <div key={s.id} className={`flex items-center gap-3 rounded-xl border border-borde bg-surface p-4 ${!s.activa ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-texto">{s.nombre}</div>
                <div className="text-xs text-texto-suave">{s.direccion ?? "Sin dirección"}{s.telefono ? ` · ${s.telefono}` : ""}</div>
              </div>
              {!s.activa && <Badge variante="peligro">Inactiva</Badge>}
              <div className="flex gap-1">
                <button onClick={() => setModal({ sucursal: s })} className="p-1.5 rounded-lg hover:bg-surface-hover text-texto-suave" title="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => alternarActiva(s)}
                  className="p-1.5 rounded-lg hover:bg-surface-hover text-texto-suave"
                  title={s.activa ? "Desactivar" : "Activar"}
                >
                  {s.activa ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ModalSucursal sucursal={modal.sucursal} onCerrar={() => setModal(null)} onGuardado={() => { setModal(null); cargar(); }} />
      )}
    </div>
  );
}
