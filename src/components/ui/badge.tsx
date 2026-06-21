import { cn } from "@/lib/utils";

type BadgeVariante = "marca" | "exito" | "peligro" | "advertencia" | "neutro" | "caliente" | "tibio" | "frio" | "ganado" | "perdido" | "archivado" | "activo";

interface BadgeProps {
  variante?: BadgeVariante;
  children: React.ReactNode;
  className?: string;
  tamano?: "sm" | "md";
}

const VARIANTES: Record<BadgeVariante, string> = {
  marca: "bg-marca-suave text-marca border-marca/20",
  exito: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400",
  peligro: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
  advertencia: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
  neutro: "bg-fondo-alt text-texto-suave border-borde",
  caliente: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400",
  tibio: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
  frio: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
  ganado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  perdido: "bg-slate-100 text-slate-600 border-slate-200",
  archivado: "bg-stone-100 text-stone-600 border-stone-200",
  activo: "bg-marca-suave text-marca border-marca/20",
};

export function Badge({ variante = "neutro", children, className, tamano = "sm" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        tamano === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        VARIANTES[variante],
        className
      )}
    >
      {children}
    </span>
  );
}
