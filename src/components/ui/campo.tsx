"use client";
import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CampoBase {
  label?: string;
  error?: string;
  helpText?: string;
  icono?: React.ReactNode;
  required?: boolean;
}

interface InputProps extends CampoBase, InputHTMLAttributes<HTMLInputElement> {}
interface TextareaProps extends CampoBase, TextareaHTMLAttributes<HTMLTextAreaElement> {}
interface SelectProps extends CampoBase, SelectHTMLAttributes<HTMLSelectElement> {
  opciones: { valor: string; etiqueta: string }[];
}

const estiloBase =
  "w-full rounded-xl border border-borde bg-surface px-4 py-2.5 text-sm text-texto placeholder:text-texto-muy-suave transition-colors focus:outline-none focus:ring-2 focus:ring-marca/30 focus:border-marca disabled:opacity-50 disabled:cursor-not-allowed";

export const Campo = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, icono, required, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-texto">
          {label} {required && <span className="text-peligro">*</span>}
        </label>
      )}
      <div className="relative">
        {icono && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-suave">{icono}</span>}
        <input
          ref={ref}
          className={cn(estiloBase, icono && "pl-10", error && "border-peligro focus:ring-peligro/30", className)}
          {...props}
        />
      </div>
      {helpText && !error && <p className="text-xs text-texto-suave">{helpText}</p>}
      {error && <p className="text-xs text-peligro">{error}</p>}
    </div>
  )
);
Campo.displayName = "Campo";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helpText, required, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-texto">
          {label} {required && <span className="text-peligro">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(estiloBase, "min-h-[80px] resize-y", error && "border-peligro", className)}
        {...props}
      />
      {helpText && !error && <p className="text-xs text-texto-suave">{helpText}</p>}
      {error && <p className="text-xs text-peligro">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

export function Select({ label, error, helpText, required, opciones, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-texto">
          {label} {required && <span className="text-peligro">*</span>}
        </label>
      )}
      <select className={cn(estiloBase, "cursor-pointer", error && "border-peligro", className)} {...props}>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
        ))}
      </select>
      {helpText && !error && <p className="text-xs text-texto-suave">{helpText}</p>}
      {error && <p className="text-xs text-peligro">{error}</p>}
    </div>
  );
}
