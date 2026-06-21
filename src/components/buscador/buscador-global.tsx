"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Users, CalendarDays, Wallet, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Resultado {
  tipo: "cliente" | "cita" | "pago";
  id: string;
  titulo: string;
  subtitulo?: string;
  href: string;
}

interface BuscadorGlobalProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function BuscadorGlobal({ abierto, onCerrar }: BuscadorGlobalProps) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [seleccionado, setSeleccionado] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Atajos de teclado globales
  useEffect(() => {
    const manejar = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); /* se abre desde header */ }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, []);

  useEffect(() => {
    if (abierto) {
      setQuery("");
      setResultados([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [abierto]);

  const buscar = useCallback(async (q: string) => {
    if (q.length < 2) { setResultados([]); return; }
    setCargando(true);
    try {
      const res = await fetch(`/api/buscador?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!json.ok) return;

      const items: Resultado[] = [
        ...json.data.clientes.map((c: { id: string; nombre: string; etapa: string; telefono?: string }) => ({
          tipo: "cliente" as const, id: c.id, titulo: c.nombre,
          subtitulo: `${c.etapa} · ${c.telefono ?? ""}`, href: `/clientes/${c.id}`,
        })),
        ...json.data.citas.map((c: { id: string; cliente: { id: string; nombre: string }; fecha: string }) => ({
          tipo: "cita" as const, id: c.id, titulo: c.cliente.nombre,
          subtitulo: `Cita · ${new Date(c.fecha).toLocaleDateString("es-MX")}`, href: `/clientes/${c.cliente.id}`,
        })),
        ...json.data.pagos.map((p: { id: string; cliente: { id: string; nombre: string }; monto: number; estatus: string }) => ({
          tipo: "pago" as const, id: p.id, titulo: p.cliente.nombre,
          subtitulo: `Pago · $${p.monto.toLocaleString("es-MX")} · ${p.estatus}`, href: `/clientes/${p.cliente.id}`,
        })),
      ];
      setResultados(items);
      setSeleccionado(0);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscar(query), 300);
    return () => clearTimeout(t);
  }, [query, buscar]);

  function ir(href: string) {
    router.push(href);
    onCerrar();
  }

  function manejarTeclado(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSeleccionado((s) => Math.min(s + 1, resultados.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSeleccionado((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && resultados[seleccionado]) ir(resultados[seleccionado].href);
    if (e.key === "Escape") onCerrar();
  }

  const ICONOS = { cliente: Users, cita: CalendarDays, pago: Wallet };

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative z-10 w-full max-w-xl bg-surface rounded-2xl border border-borde shadow-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-borde">
          <Search className="h-5 w-5 text-texto-suave flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={manejarTeclado}
            placeholder="Buscar clientes, citas, pagos..."
            className="flex-1 bg-transparent text-texto placeholder:text-texto-muy-suave outline-none text-sm"
          />
          {cargando && <div className="h-4 w-4 border-2 border-marca border-t-transparent rounded-full animate-spin" />}
          <button onClick={onCerrar} className="text-texto-suave hover:text-texto"><X className="h-4 w-4" /></button>
        </div>

        {resultados.length > 0 ? (
          <ul className="max-h-72 overflow-y-auto py-2">
            {resultados.map((r, i) => {
              const Icono = ICONOS[r.tipo];
              return (
                <li key={r.id}>
                  <button
                    onClick={() => ir(r.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      seleccionado === i ? "bg-marca-suave" : "hover:bg-surface-hover"
                    )}
                  >
                    <Icono className="h-4 w-4 text-texto-suave flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-texto">{r.titulo}</div>
                      {r.subtitulo && <div className="text-xs text-texto-suave">{r.subtitulo}</div>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : query.length >= 2 && !cargando ? (
          <div className="py-10 text-center text-texto-suave text-sm">
            No encontré nada con &quot;{query}&quot;. Revisa cómo lo escribiste.
          </div>
        ) : (
          <div className="py-6 text-center text-texto-muy-suave text-xs">
            Escribe al menos 2 caracteres para buscar
          </div>
        )}
      </div>
    </div>
  );
}
