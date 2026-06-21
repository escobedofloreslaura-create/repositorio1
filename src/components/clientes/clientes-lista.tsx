"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Filter, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/boton";
import { TemperaturaBadge } from "@/components/ui/temperatura-badge";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { LinkCliente } from "@/components/layout/link-cliente";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonLista } from "@/components/ui/skeleton";
import type { SesionUsuario } from "@/lib/auth";

interface Cliente {
  id: string;
  nombre: string;
  etapa: string;
  estado: string;
  temperatura: string;
  valorEstimado: number | null;
  proximaAccion: string | null;
  proximaAccionFecha: Date | string | null;
  telefono: string | null;
  vendedor: { nombre: string } | null;
}

export function ClientesLista({ sesion, estadoInicial = "ACTIVO" }: { sesion: SesionUsuario; estadoInicial?: string }) {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState(estadoInicial);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({
        pagina: String(pagina),
        estado,
        ...(busqueda ? { q: busqueda } : {}),
      });
      const res = await fetch(`/api/clientes?${params}`);
      const json = await res.json();
      if (json.ok) { setClientes(json.data); setTotal(json.total); }
    } finally {
      setCargando(false);
    }
  }, [pagina, busqueda, estado]);

  useEffect(() => { cargar(); }, [cargar]);

  const ESTADOS = ["ACTIVO", "GANADO", "PERDIDO", "ARCHIVADO"];

  return (
    <div className="space-y-4">
      {/* Filtros y acciones */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {ESTADOS.map((e) => (
            <button
              key={e}
              onClick={() => { setEstado(e); setPagina(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors
                ${estado === e ? "bg-marca text-white" : "bg-surface border border-borde text-texto-suave hover:bg-surface-hover"}`}
            >
              {e === "ACTIVO" ? "Activos" : e === "GANADO" ? "Ganados" : e === "PERDIDO" ? "Perdidos" : "Archivados"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-texto-suave" />
            <input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              placeholder="Buscar..."
              className="pl-9 pr-4 py-2 rounded-xl border border-borde bg-surface text-sm w-full sm:w-48 outline-none focus:ring-2 focus:ring-marca/30 focus:border-marca"
            />
          </div>
          <Boton icono={<Plus className="h-4 w-4" />} onClick={() => router.push("/clientes/nuevo")}>
            Nuevo
          </Boton>
        </div>
      </div>

      {/* Contador */}
      <p className="text-sm text-texto-suave">Mostrando {clientes.length} de {total} clientes</p>

      {/* Lista */}
      {cargando ? (
        <SkeletonLista filas={8} />
      ) : clientes.length === 0 ? (
        <EmptyState
          titulo="No hay clientes aquí"
          descripcion="Crea tu primer cliente o ajusta los filtros."
          accion={{ etiqueta: "+ Nuevo cliente", onClick: () => router.push("/clientes/nuevo") }}
        />
      ) : (
        <div className="space-y-2">
          {clientes.map((c) => {
            const vencida = c.proximaAccionFecha && new Date(c.proximaAccionFecha) < new Date();
            return (
              <div key={c.id} className="bg-surface border border-borde rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-sm transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <LinkCliente id={c.id} nombre={c.nombre} className="text-base" />
                    <EstadoBadge estado={c.estado} />
                    <TemperaturaBadge temperatura={c.temperatura} />
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-texto-suave">
                    <span>{c.etapa}</span>
                    {c.valorEstimado && <span className="font-medium text-texto">${c.valorEstimado.toLocaleString("es-MX")}</span>}
                    {c.proximaAccion && (
                      <span className={vencida ? "text-peligro font-medium" : ""}>
                        {vencida && "⚠️ "}{c.proximaAccion}
                        {c.proximaAccionFecha && ` · ${new Date(c.proximaAccionFecha).toLocaleDateString("es-MX")}`}
                      </span>
                    )}
                  </div>
                </div>
                {sesion.rol === "ADMIN" && c.vendedor && (
                  <span className="text-xs text-texto-suave hidden sm:block">{c.vendedor.nombre}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {total > 25 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Boton variante="secundario" tamano="sm" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>← Anterior</Boton>
          <span className="text-sm text-texto-suave">Página {pagina}</span>
          <Boton variante="secundario" tamano="sm" disabled={clientes.length < 25} onClick={() => setPagina((p) => p + 1)}>Siguiente →</Boton>
        </div>
      )}
    </div>
  );
}
