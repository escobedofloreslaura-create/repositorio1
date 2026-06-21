"use client";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Trophy } from "lucide-react";

interface Vendedor {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  clientes: Array<{ id: string; estado: string; valorEstimado: number | null; creadoEn: Date | string }>;
}

export function EquipoPanel({ vendedores, inicioMes }: { vendedores: Vendedor[]; inicioMes: string }) {
  const inicio = new Date(inicioMes);

  const ranking = vendedores
    .map((v) => {
      const activos = v.clientes.filter((c) => c.estado === "ACTIVO");
      const ganados = v.clientes.filter((c) => c.estado === "GANADO");
      const nuevosEsteMes = v.clientes.filter((c) => new Date(c.creadoEn) >= inicio);
      const valorTotal = ganados.reduce((s, c) => s + (c.valorEstimado ?? 0), 0);
      return { ...v, activos: activos.length, ganados: ganados.length, nuevosEsteMes: nuevosEsteMes.length, valorTotal };
    })
    .sort((a, b) => b.ganados - a.ganados || b.valorTotal - a.valorTotal);

  const medallas = ["🥇", "🥈", "🥉"];

  return (
    <div className="max-w-3xl space-y-4">
      {ranking.map((v, i) => (
        <Tarjeta key={v.id} className={i === 0 ? "border-amber-300 bg-amber-50/30" : ""}>
          <div className="flex items-center gap-4">
            <span className="text-2xl w-8 text-center">{medallas[i] ?? `#${i + 1}`}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-texto">{v.nombre}</h3>
                <span className="text-xs text-texto-suave px-2 py-0.5 bg-surface-hover rounded-full">{v.rol}</span>
              </div>
              <p className="text-xs text-texto-suave mt-0.5">{v.correo}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-texto">{v.ganados}</p>
                <p className="text-xs text-texto-suave">Ganados</p>
              </div>
              <div>
                <p className="text-lg font-bold text-texto">{v.activos}</p>
                <p className="text-xs text-texto-suave">Activos</p>
              </div>
              <div>
                <p className="text-lg font-bold text-marca">${v.valorTotal.toLocaleString("es-MX")}</p>
                <p className="text-xs text-texto-suave">Valor</p>
              </div>
            </div>
          </div>
          {v.nuevosEsteMes > 0 && (
            <p className="text-xs text-emerald-600 mt-2">+{v.nuevosEsteMes} clientes nuevos este mes</p>
          )}
        </Tarjeta>
      ))}
      {ranking.length === 0 && (
        <Tarjeta>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-texto-suave mx-auto mb-3" />
            <p className="text-texto-suave">Sin datos de equipo</p>
          </div>
        </Tarjeta>
      )}
    </div>
  );
}
