"use client";
import { useEffect, useRef, useState } from "react";
import { ScanBarcode, PackageX } from "lucide-react";
import { formatearMoneda } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { PosProductoT, PosDepartamentoT } from "@/lib/pos/tipos";

export function BuscadorProductos({
  departamentos,
  onSeleccionar,
  onCodigoNoEncontrado,
  version = 0,
}: {
  departamentos: PosDepartamentoT[];
  onSeleccionar: (producto: PosProductoT) => void;
  onCodigoNoEncontrado: (codigo: string) => void;
  version?: number;
}) {
  const [q, setQ] = useState("");
  const [departamentoId, setDepartamentoId] = useState<string | null>(null);
  const [resultados, setResultados] = useState<PosProductoT[]>([]);
  const [cargando, setCargando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controlador = new AbortController();
    setCargando(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (departamentoId) params.set("departamentoId", departamentoId);

    const t = setTimeout(() => {
      fetch(`/api/pos/productos?${params.toString()}`, { signal: controlador.signal })
        .then((r) => r.json())
        .then((json) => {
          if (json.ok) setResultados(json.data);
        })
        .catch(() => {})
        .finally(() => setCargando(false));
    }, 200);

    return () => {
      clearTimeout(t);
      controlador.abort();
    };
  }, [q, departamentoId, version]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const codigoExacto = resultados.find((p) => p.codigoBarras === q.trim());
    if (codigoExacto) {
      onSeleccionar(codigoExacto);
      setQ("");
      return;
    }
    if (resultados.length === 1) {
      onSeleccionar(resultados[0]);
      setQ("");
      return;
    }
    if (/^\d{6,}$/.test(q.trim()) && resultados.length === 0) {
      onCodigoNoEncontrado(q.trim());
      setQ("");
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3 border-b border-borde">
        <div className="relative">
          <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-texto-suave" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por nombre o escanear código de barras…"
            autoFocus
            className="w-full rounded-xl border border-borde bg-surface pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-marca/30 focus:border-marca"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setDepartamentoId(null)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              !departamentoId ? "bg-marca text-white border-marca" : "border-borde text-texto-suave hover:bg-surface-hover"
            )}
          >
            Todos
          </button>
          {departamentos.map((d) => (
            <button
              key={d.id}
              onClick={() => setDepartamentoId(d.id === departamentoId ? null : d.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                departamentoId === d.id ? "bg-marca text-white border-marca" : "border-borde text-texto-suave hover:bg-surface-hover"
              )}
            >
              {d.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {cargando && resultados.length === 0 ? (
          <p className="text-sm text-texto-suave text-center py-8">Buscando…</p>
        ) : resultados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-texto-muy-suave gap-2">
            <PackageX className="h-8 w-8" />
            <p className="text-sm">Sin resultados</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {resultados.map((p) => (
              <button
                key={p.id}
                onClick={() => onSeleccionar(p)}
                disabled={p.existencia <= 0}
                className="text-left rounded-xl border border-borde p-3 hover:border-marca hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="text-sm font-medium text-texto line-clamp-2 min-h-[2.5rem]">{p.nombre}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-marca font-semibold">{formatearMoneda(p.precioVenta)}</span>
                  <span className={cn("text-xs", p.existencia <= p.existenciaMinima ? "text-peligro" : "text-texto-suave")}>
                    {p.existencia} {p.unidad === "CAJA" ? "cajas" : "pz"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
