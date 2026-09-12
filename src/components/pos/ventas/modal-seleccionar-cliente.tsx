"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Search, Users } from "lucide-react";
import type { PosClienteT } from "@/lib/pos/tipos";
import { ETIQUETAS_TIPO_PRECIO_CLIENTE } from "@/lib/pos/constantes";

export function ModalSeleccionarCliente({
  onCerrar,
  onSeleccionar,
}: {
  onCerrar: () => void;
  onSeleccionar: (cliente: PosClienteT | null) => void;
}) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<PosClienteT[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResultados([]);
      return;
    }
    const controlador = new AbortController();
    setCargando(true);
    const t = setTimeout(() => {
      fetch(`/api/pos/clientes?q=${encodeURIComponent(q.trim())}`, { signal: controlador.signal })
        .then((r) => r.json())
        .then((json) => { if (json.ok) setResultados(json.data); })
        .catch(() => {})
        .finally(() => setCargando(false));
    }, 250);

    return () => {
      clearTimeout(t);
      controlador.abort();
    };
  }, [q]);

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Asignar cliente a la cuenta" tamano="lg">
      <div className="space-y-4">
        <p className="text-sm text-texto-suave">
          Al asignar un cliente con precio de mayoreo o cliente frecuente, esos precios se aplican en automático a los productos de esta cuenta.
        </p>

        <button
          type="button"
          onClick={() => onSeleccionar(null)}
          className="w-full flex items-center gap-2 rounded-xl border border-borde p-3 text-left text-sm font-medium text-texto hover:bg-surface-hover"
        >
          <Users className="h-4 w-4 text-texto-suave" /> Público en general (sin cliente / precio normal)
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-texto-suave" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente por nombre o teléfono…"
            className="w-full rounded-xl border border-borde bg-surface pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-marca/30 focus:border-marca"
          />
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {cargando ? (
            <p className="text-sm text-texto-suave text-center py-6">Buscando…</p>
          ) : !q.trim() ? (
            <p className="text-sm text-texto-muy-suave text-center py-6">Escribe el nombre de un cliente.</p>
          ) : resultados.length === 0 ? (
            <p className="text-sm text-texto-muy-suave text-center py-6">Sin resultados.</p>
          ) : (
            resultados.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSeleccionar(c)}
                className="w-full flex items-center justify-between gap-2 rounded-xl border border-borde p-3 text-left hover:bg-surface-hover"
              >
                <div>
                  <p className="text-sm font-medium text-texto">{c.nombre}</p>
                  <p className="text-xs text-texto-suave">{c.telefono ?? "sin teléfono"}</p>
                </div>
                {c.tipoPrecio !== "VENTA" && <Badge variante="marca">{ETIQUETAS_TIPO_PRECIO_CLIENTE[c.tipoPrecio]}</Badge>}
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
