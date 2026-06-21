import Link from "next/link";
import { cn } from "@/lib/utils";

interface LinkClienteProps {
  id: string;
  nombre: string;
  className?: string;
}

export function LinkCliente({ id, nombre, className }: LinkClienteProps) {
  return (
    <Link
      href={`/clientes/${id}`}
      className={cn(
        "font-medium text-texto hover:text-marca hover:underline cursor-pointer transition-colors min-h-[44px] inline-flex items-center",
        className
      )}
    >
      {nombre}
    </Link>
  );
}
