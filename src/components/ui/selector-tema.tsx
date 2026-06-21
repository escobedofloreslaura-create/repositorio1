"use client";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTema } from "@/components/layout/tema-proveedor";
import { cn } from "@/lib/utils";

const TEMAS = [
  { valor: "claro", etiqueta: "Claro", Icono: Sun },
  { valor: "oscuro", etiqueta: "Oscuro", Icono: Moon },
  { valor: "sistema", etiqueta: "Automático", Icono: Monitor },
] as const;

export function SelectorTema({ compact = false }: { compact?: boolean }) {
  const { tema, cambiarTema } = useTema();

  if (compact) {
    const actual = TEMAS.find((t) => t.valor === tema) ?? TEMAS[2];
    return (
      <button
        onClick={() => {
          const idx = TEMAS.findIndex((t) => t.valor === tema);
          cambiarTema(TEMAS[(idx + 1) % TEMAS.length].valor);
        }}
        className="flex items-center justify-center h-9 w-9 rounded-xl text-texto-suave hover:text-texto hover:bg-surface-hover transition-colors"
        aria-label="Cambiar tema"
        title={`Tema: ${actual.etiqueta}`}
      >
        <actual.Icono className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      {TEMAS.map(({ valor, etiqueta, Icono }) => (
        <button
          key={valor}
          onClick={() => cambiarTema(valor)}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-all text-sm font-medium",
            tema === valor
              ? "border-marca bg-marca-suave text-marca"
              : "border-borde bg-surface text-texto-suave hover:bg-surface-hover"
          )}
        >
          <Icono className="h-5 w-5" />
          <span>{etiqueta}</span>
        </button>
      ))}
    </div>
  );
}
