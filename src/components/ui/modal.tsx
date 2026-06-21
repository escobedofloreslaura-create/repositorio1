"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo?: string;
  children: React.ReactNode;
  tamano?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Modal({ abierto, onCerrar, titulo, children, tamano = "md", className }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const manejarEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    if (abierto) {
      document.addEventListener("keydown", manejarEsc);
      document.body.style.overflow = "hidden";
      ref.current?.focus();
    }
    return () => {
      document.removeEventListener("keydown", manejarEsc);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const tamanos = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCerrar}
        aria-hidden
      />
      <div
        ref={ref}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full rounded-2xl bg-surface border border-borde shadow-lg",
          "max-h-[90dvh] overflow-y-auto",
          tamanos[tamano],
          className
        )}
        style={{ outline: "none" }}
      >
        {titulo && (
          <div className="flex items-center justify-between border-b border-borde px-6 py-4">
            <h2 className="text-base font-semibold text-texto">{titulo}</h2>
            <button
              onClick={onCerrar}
              className="text-texto-suave hover:text-texto rounded-lg p-1 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
