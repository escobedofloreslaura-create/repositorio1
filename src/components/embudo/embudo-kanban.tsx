"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TemperaturaBadge } from "@/components/ui/temperatura-badge";
import { LinkCliente } from "@/components/layout/link-cliente";
import { ETAPAS_EMBUDO } from "@/lib/constantes";
import toast from "react-hot-toast";
import type { SesionUsuario } from "@/lib/auth";

interface ClienteKanban {
  id: string;
  nombre: string;
  etapa: string;
  temperatura: string;
  valorEstimado: number | null;
  proximaAccion: string | null;
  proximaAccionFecha: Date | string | null;
  telefono: string | null;
  vendedor: { nombre: string } | null;
}

export function EmbudoKanban({ clientes, sesion }: { clientes: ClienteKanban[]; sesion: SesionUsuario }) {
  const router = useRouter();
  const [items, setItems] = useState(clientes);
  const [dragging, setDragging] = useState<string | null>(null);

  const moverCliente = useCallback(async (clienteId: string, nuevaEtapa: string) => {
    setItems((prev) => prev.map((c) => c.id === clienteId ? { ...c, etapa: nuevaEtapa } : c));
    try {
      const res = await fetch(`/api/clientes/${clienteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa: nuevaEtapa }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error("No se pudo mover el cliente");
        router.refresh();
      }
    } catch {
      toast.error("Error de conexión");
      router.refresh();
    }
  }, [router]);

  function onDragStart(e: React.DragEvent, id: string) {
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDrop(e: React.DragEvent, etapa: string) {
    e.preventDefault();
    if (dragging) {
      const cliente = items.find((c) => c.id === dragging);
      if (cliente && cliente.etapa !== etapa) moverCliente(dragging, etapa);
    }
    setDragging(null);
  }

  const etapas = ETAPAS_EMBUDO;
  const etapasConClientes = etapas.filter((e) => items.some((c) => c.etapa === e) || true);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {etapasConClientes.map((etapa) => {
        const clientesEtapa = items.filter((c) => c.etapa === etapa);
        const valor = clientesEtapa.reduce((s, c) => s + (c.valorEstimado ?? 0), 0);
        return (
          <div
            key={etapa}
            className="flex-shrink-0 w-64 flex flex-col"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, etapa)}
          >
            <div className="mb-2 px-1">
              <h3 className="text-xs font-semibold text-texto-suave uppercase tracking-wide truncate">{etapa}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-texto-suave">{clientesEtapa.length}</span>
                {valor > 0 && <span className="text-xs font-medium text-marca">${valor.toLocaleString("es-MX")}</span>}
              </div>
            </div>
            <div className="flex-1 space-y-2 min-h-[200px] p-2 rounded-2xl bg-fondo border border-borde">
              {clientesEtapa.map((c) => {
                const vencida = c.proximaAccionFecha && new Date(c.proximaAccionFecha) < new Date();
                return (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, c.id)}
                    className="bg-surface border border-borde rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow select-none"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <LinkCliente id={c.id} nombre={c.nombre} className="text-sm font-medium leading-tight" />
                      <TemperaturaBadge temperatura={c.temperatura} />
                    </div>
                    {c.valorEstimado && (
                      <p className="text-xs font-medium text-marca">${c.valorEstimado.toLocaleString("es-MX")}</p>
                    )}
                    {c.proximaAccion && (
                      <p className={`text-xs mt-1 ${vencida ? "text-peligro font-medium" : "text-texto-suave"}`}>
                        {vencida && "⚠️ "}{c.proximaAccion}
                      </p>
                    )}
                    {sesion.rol === "ADMIN" && c.vendedor && (
                      <p className="text-xs text-texto-muy-suave mt-1">{c.vendedor.nombre}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
