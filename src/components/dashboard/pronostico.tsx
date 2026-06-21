import { Tarjeta } from "@/components/ui/tarjeta";

interface PronosticoProps {
  pronostico: number;
  meta: number;
  cobrado: number;
  diasRestantes: number;
  semaforo: string;
}

export function Pronostico({ pronostico, meta, cobrado, diasRestantes, semaforo }: PronosticoProps) {
  const falta = Math.max(0, meta - cobrado);
  const emoji = semaforo === "verde" ? "🟢" : semaforo === "amarillo" ? "🟡" : "🔴";
  const frase = semaforo === "verde"
    ? "¡Vas a llegar a la meta!"
    : semaforo === "amarillo"
    ? "Ajustado — dale con todo"
    : `Necesitas cerrar $${falta.toLocaleString("es-MX")} en ${diasRestantes} días`;

  return (
    <Tarjeta>
      <h2 className="font-semibold text-texto mb-4">Pronóstico de cierre</h2>
      <div className="text-3xl font-bold text-texto mb-1">${pronostico.toLocaleString("es-MX")}</div>
      <p className="text-sm text-texto-suave mb-4">Estimado a partir del embudo activo</p>
      <div className={`rounded-xl px-4 py-3 text-sm font-medium
        ${semaforo === "verde" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
          semaforo === "amarillo" ? "bg-amber-50 text-amber-700 border border-amber-200" :
          "bg-red-50 text-red-700 border border-red-200"}`}>
        {emoji} {frase}
      </div>
    </Tarjeta>
  );
}
