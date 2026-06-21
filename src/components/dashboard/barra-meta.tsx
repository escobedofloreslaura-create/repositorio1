"use client";

interface BarraMetaProps {
  actual: number;
  meta: number;
  diasRestantes: number;
  semaforo: string;
}

export function BarraMeta({ actual, meta, diasRestantes, semaforo }: BarraMetaProps) {
  const pct = Math.min(100, Math.round((actual / meta) * 100));
  const color = semaforo === "verde" ? "bg-emerald-500" : semaforo === "amarillo" ? "bg-amber-500" : "bg-red-500";
  const textoColor = semaforo === "verde" ? "text-emerald-600" : semaforo === "amarillo" ? "text-amber-600" : "text-red-600";

  return (
    <div className="rounded-2xl border border-borde bg-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-texto">Meta del mes</h2>
          <p className="text-sm text-texto-suave">Faltan {diasRestantes} días para cerrar el mes</p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${textoColor}`}>{pct}%</span>
          <p className="text-xs text-texto-suave">${actual.toLocaleString("es-MX")} de ${meta.toLocaleString("es-MX")}</p>
        </div>
      </div>
      <div className="h-3 rounded-full bg-fondo-alt overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {pct < 100 && (
        <p className="text-xs text-texto-suave mt-2">
          Necesitas <span className="font-semibold text-texto">${(meta - actual).toLocaleString("es-MX")}</span> más en {diasRestantes} días.
        </p>
      )}
    </div>
  );
}
