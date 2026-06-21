"use client";
import { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "fantasma" | "peligro" | "exito";
  tamano?: "sm" | "md" | "lg";
  cargando?: boolean;
  icono?: React.ReactNode;
  iconoDerecha?: React.ReactNode;
}

export const Boton = forwardRef<HTMLButtonElement, BotonProps>(
  (
    {
      variante = "primario",
      tamano = "md",
      cargando = false,
      icono,
      iconoDerecha,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-marca select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

    const variantes = {
      primario:
        "bg-marca text-white hover:bg-marca-oscuro shadow-sm hover:shadow-md focus-visible:ring-marca",
      secundario:
        "bg-surface border border-borde text-texto hover:bg-surface-hover shadow-sm",
      fantasma:
        "text-texto-suave hover:text-texto hover:bg-surface-hover",
      peligro:
        "bg-red-500 text-white hover:bg-red-600 shadow-sm focus-visible:ring-red-500",
      exito:
        "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm focus-visible:ring-emerald-500",
    };

    const tamanos = {
      sm: "h-8 px-3 text-sm gap-1.5",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || cargando}
        aria-busy={cargando}
        className={cn(base, variantes[variante], tamanos[tamano], className)}
        {...props}
      >
        {cargando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          icono && <span aria-hidden>{icono}</span>
        )}
        {children && <span>{children}</span>}
        {iconoDerecha && !cargando && (
          <span aria-hidden>{iconoDerecha}</span>
        )}
      </button>
    );
  }
);
Boton.displayName = "Boton";
