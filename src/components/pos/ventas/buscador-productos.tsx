"use client";
import { useEffect, useRef, useState } from "react";
import { ScanBarcode } from "lucide-react";
import { formatearMoneda } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { PosProductoT } from "@/lib/pos/tipos";

export function BuscadorProductos({
  onSeleccionar,
  onCodigoNoEncontrado,
  version = 0,
}: {
  onSeleccionar: (producto: PosProductoT) => void;
  onCodigoNoEncontrado: (codigo: string) => void;
  version?: number;
}) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<PosProductoT[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!q.trim()) {
      setResultados([]);
      return;
    }
    const controlador = new AbortController();
    setCargando(true);
    const params = new URLSearchParams({ q: q.trim() });

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
  }, [q, version]);

  function seleccionar(p: PosProductoT) {
    onSeleccionar(p);
    setQ("");
    setResultados([]);
    inputRef.current?.focus();
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const codigo = q.trim();
    if (!codigo) return;

    const codigoExacto = resultados.find((p) => p.codigoBarras === codigo);
    if (codigoExacto) return seleccionar(codigoExacto);
    if (resultados.length === 1) return seleccionar(resultados[0]);

    // Un lector de código de barras escribe el código completo y manda Enter
    // en unos cuantos milisegundos, mucho más rápido que el debounce de la
    // búsqueda (200ms) — en ese instante "resultados" puede seguir vacío o
    // desactualizado. Antes de darlo por "no encontrado" se confirma con una
    // búsqueda inmediata en vez de confiar en lo que dejó el último debounce,
    // para no mandar a "producto no registrado" un código que sí existe.
    setCargando(true);
    try {
      const res = await fetch(`/api/pos/productos?q=${encodeURIComponent(codigo)}`);
      const json = await res.json();
      const lista: PosProductoT[] = json.ok ? json.data : [];
      setResultados(lista);
      const encontrado = lista.find((p) => p.codigoBarras === codigo);
      if (encontrado) return seleccionar(encontrado);
      if (lista.length === 1) return seleccionar(lista[0]);
    } finally {
      setCargando(false);
    }

    if (/^\d{6,}$/.test(codigo)) {
      onCodigoNoEncontrado(codigo);
      setQ("");
    }
  }

  const mostrarLista = enfocado && q.trim().length > 0;

  return (
    <div className="p-4 border-b border-borde relative">
      <div className="relative">
        <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-texto-suave" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setTimeout(() => setEnfocado(false), 150)}
          placeholder="Buscar por nombre o escanear código de barras…"
          autoFocus
          className="w-full rounded-xl border border-borde bg-surface pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-marca/30 focus:border-marca"
        />

        {mostrarLista && (
          <div className="absolute left-0 right-0 top-full mt-2 z-20 max-h-80 overflow-y-auto rounded-xl border border-borde bg-surface shadow-lg">
            {cargando && resultados.length === 0 ? (
              <p className="text-sm text-texto-suave text-center py-6">Buscando…</p>
            ) : resultados.length === 0 ? (
              <p className="text-sm text-texto-muy-suave text-center py-6">Sin resultados</p>
            ) : (
              resultados.map((p) => (
                <button
                  key={p.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => seleccionar(p)}
                  disabled={p.existencia <= 0}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed border-b border-borde last:border-0"
                >
                  <span className="text-sm font-medium text-texto truncate">{p.nombre}</span>
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-marca font-semibold text-sm">{formatearMoneda(p.precioVenta)}</span>
                    <span className={cn("text-xs", p.existencia <= p.existenciaMinima ? "text-peligro" : "text-texto-suave")}>
                      {p.existencia} {p.unidad === "CAJA" ? "cajas" : "pz"}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
