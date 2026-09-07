"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PosSucursalT } from "@/lib/pos/tipos";

// Selector de sucursal activa, exclusivo del Administrador General: cambia
// la tienda en la que está "parado" (existencias, ventas, corte, clientes,
// etc.) sin afectar a los usuarios de cada tienda, que siempre ven la suya.
export function SucursalSwitcher() {
  const router = useRouter();
  const [sucursales, setSucursales] = useState<PosSucursalT[]>([]);
  const [activaId, setActivaId] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [cambiando, setCambiando] = useState(false);

  async function cargar() {
    const [resLista, resActiva] = await Promise.all([
      fetch("/api/pos/sucursales"),
      fetch("/api/pos/sucursales/activa"),
    ]);
    const [jsonLista, jsonActiva] = await Promise.all([resLista.json(), resActiva.json()]);
    if (jsonLista.ok) setSucursales(jsonLista.data);
    if (jsonActiva.ok) setActivaId(jsonActiva.data?.id ?? null);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function elegir(id: string) {
    if (id === activaId) return setAbierto(false);
    setCambiando(true);
    try {
      const res = await fetch("/api/pos/sucursales/activa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sucursalId: id }),
      });
      const json = await res.json();
      if (json.ok) {
        setActivaId(id);
        setAbierto(false);
        router.refresh();
      }
    } finally {
      setCambiando(false);
    }
  }

  const activa = sucursales.find((s) => s.id === activaId);

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        disabled={cambiando}
        className="w-full flex items-center gap-2 rounded-xl border border-borde bg-surface-hover px-3 py-2 text-left text-sm font-medium text-texto"
      >
        <Store className="h-4 w-4 flex-shrink-0 text-marca" />
        <span className="flex-1 min-w-0 truncate">{activa?.nombre ?? "Elegir sucursal"}</span>
        <ChevronDown className={cn("h-4 w-4 flex-shrink-0 transition-transform", abierto && "rotate-180")} />
      </button>

      {abierto && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-borde bg-surface shadow-lg overflow-hidden">
          {sucursales.map((s) => (
            <button
              key={s.id}
              onClick={() => elegir(s.id)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors",
                s.id === activaId && "bg-marca-suave text-marca font-medium"
              )}
            >
              {s.nombre}
              {!s.activa && <span className="ml-1 text-xs text-texto-muy-suave">(inactiva)</span>}
            </button>
          ))}
          {sucursales.length === 0 && <div className="px-3 py-2 text-sm text-texto-suave">Sin sucursales</div>}
        </div>
      )}
    </div>
  );
}
