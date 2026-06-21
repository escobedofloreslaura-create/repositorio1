import { Boton } from "./boton";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icono?: React.ReactNode;
  titulo: string;
  descripcion?: string;
  accion?: { etiqueta: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icono, titulo, descripcion, accion, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      {icono && (
        <div className="mb-4 p-4 rounded-2xl bg-marca-suave text-marca">
          {icono}
        </div>
      )}
      <h3 className="text-lg font-semibold text-texto mb-2">{titulo}</h3>
      {descripcion && <p className="text-texto-suave max-w-sm">{descripcion}</p>}
      {accion && (
        <Boton className="mt-6" onClick={accion.onClick}>
          {accion.etiqueta}
        </Boton>
      )}
    </div>
  );
}
