import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Vinoexpress — Punto de Venta",
    default: "Vinoexpress — Punto de Venta",
    template: "%s · Vinoexpress",
  },
  description: "Sistema de punto de venta Vinoexpress.",
};

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
