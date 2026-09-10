"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Store, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PosProductoT } from "@/lib/pos/tipos";

export function ModalExistenciasSucursales({ onCerrar }: { onCerrar: () => void }) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<PosProductoT[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResultados([]);
      return;
    }
    const controlador = new AbortController();
    setCargando(true);
    const t = setTimeout(() => {
      fetch(`/api/pos/productos?todasSucursales=1&q=${encodeURIComponent(q.trim())}`, { signal: controlador.signal })
        .then((r) => r.json())
        .then((json) => {
          if (json.ok) setResultados(json.data);
        })
        .catch(() => {})
        .finally(() => setCargando(false));
    }, 250);

    return () => {
      clearTimeout(t);
      controlador.abort();
    };
  }, [q]);

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Existencias en otras sucursales" tamano="lg">
      <div className="space-y-4">
        <p className="text-sm text-texto-suave">
          Busca un producto para ver cuántas piezas hay en cada sucursal — útil cuando a la tuya no le alcanza para una venta.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-texto-suave" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o código de barras…"
            className="w-full rounded-xl border border-borde bg-surface pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-marca/30 focus:border-marca"
          />
        </div>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {cargando ? (
            <p className="text-sm text-texto-suave text-center py-6">Buscando…</p>
          ) : !q.trim() ? (
            <p className="text-sm text-texto-muy-suave text-center py-6">Escribe el nombre de un producto.</p>
          ) : resultados.length === 0 ? (
            <p className="text-sm text-texto-muy-suave text-center py-6">Sin resultados.</p>
          ) : (
            resultados.map((p) => (
              <div key={p.id} className="rounded-xl border border-borde p-3">
                <p className="text-sm font-medium text-texto mb-2">{p.nombre}</p>
                <div className="flex flex-wrap gap-2">
                  {(p.existenciasPorSucursal ?? []).map((e) => (
                    <span
                      key={e.sucursalId}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border",
                        e.esPropia ? "border-marca/30 bg-marca-suave text-marca" : "border-borde text-texto-suave"
                      )}
                    >
                      <Store className="h-3 w-3" />
                      {e.esPropia ? `Tu sucursal (${e.sucursalNombre})` : e.sucursalNombre}: <strong>{e.existencia}</strong>
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
