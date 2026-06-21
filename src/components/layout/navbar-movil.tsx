"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, KanbanSquare, ListChecks, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const ITEMS = [
  { href: "/dashboard", icono: LayoutDashboard, etiqueta: "Tablero" },
  { href: "/clientes", icono: Users, etiqueta: "Clientes" },
  { href: "/embudo", icono: KanbanSquare, etiqueta: "Embudo" },
  { href: "/seguimiento", icono: ListChecks, etiqueta: "Hoy" },
];

export function NavbarMovil() {
  const pathname = usePathname();
  const router = useRouter();
  const [masAbierto, setMasAbierto] = useState(false);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-borde">
        <div className="flex items-center h-16">
          {ITEMS.map(({ href, icono: Icono, etiqueta }) => {
            const activo = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors",
                  activo ? "text-marca" : "text-texto-suave"
                )}
              >
                <Icono className="h-5 w-5" />
                <span>{etiqueta}</span>
              </Link>
            );
          })}

          {/* + Nuevo */}
          <Link
            href="/clientes/nuevo"
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
          >
            <div className="h-9 w-9 rounded-full bg-marca flex items-center justify-center shadow-md">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs text-texto-suave">Nuevo</span>
          </Link>

          {/* Más */}
          <button
            onClick={() => setMasAbierto(!masAbierto)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs text-texto-suave"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Más</span>
          </button>
        </div>
      </nav>

      {/* Panel "Más" */}
      {masAbierto && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMasAbierto(false)}>
          <div className="absolute bottom-16 left-0 right-0 bg-surface border-t border-borde p-4 grid grid-cols-3 gap-3"
            onClick={(e) => e.stopPropagation()}>
            {[
              { href: "/agenda", etiqueta: "Agenda", emoji: "📅" },
              { href: "/pagos", etiqueta: "Pagos", emoji: "💳" },
              { href: "/completados", etiqueta: "Completados", emoji: "🏆" },
              { href: "/perdidos", etiqueta: "Perdidos", emoji: "❌" },
              { href: "/archivados", etiqueta: "Archivados", emoji: "📦" },
              { href: "/comparte", etiqueta: "Compartir", emoji: "📤" },
              { href: "/perfil", etiqueta: "Mi Perfil", emoji: "👤" },
            ].map(({ href, etiqueta, emoji }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMasAbierto(false)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-borde bg-surface hover:bg-surface-hover text-sm text-center"
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-texto-suave text-xs">{etiqueta}</span>
              </Link>
            ))}
            <button
              onClick={async () => {
                setMasAbierto(false);
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
              }}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-center"
            >
              <span className="text-2xl">🚪</span>
              <span className="text-red-600 text-xs">Salir</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
