"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Punto { mes: string; ingresos: number; clientesGanados?: number; clientes?: number; }

export function GraficaCrecimiento({ historico }: { historico: Punto[] }) {
  if (!historico || historico.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-texto-suave text-sm">
        Aún juntando historial — se llena solo conforme cierres ventas.
      </div>
    );
  }

  const datos = historico.map((h) => ({
    mes: h.mes,
    ingresos: h.ingresos,
    clientes: h.clientesGanados ?? h.clientes ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={datos} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--texto-suave)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--texto-suave)" }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString("es-MX")}`, "Ingresos"]}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--borde)", borderRadius: 12, fontSize: 13 }}
        />
        <Bar dataKey="ingresos" fill="var(--marca)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
