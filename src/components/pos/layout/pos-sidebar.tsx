"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingCart, Package, Users, History, Landmark, ClipboardList,
  UserCog, Settings, LogOut, Wine, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { SesionPos } from "@/lib/pos/auth";

const MENU: { href: string; icono: React.ElementType; etiqueta: string; soloAdmin?: boolean }[] = [
  { href: "/pos", icono: ShoppingCart, etiqueta: "Ventas" },
  { href: "/pos/productos", icono: Package, etiqueta: "Productos" },
  { href: "/pos/clientes", icono: Users, etiqueta: "Clientes" },
  { href: "/pos/historico", icono: History, etiqueta: "Histórico" },
  { href: "/pos/corte", icono: Landmark, etiqueta: "Corte de caja" },
  { href: "/pos/inventario", icono: ClipboardList, etiqueta: "Inventario" },
  { href: "/pos/usuarios", icono: UserCog, etiqueta: "Usuarios", soloAdmin: true },
  { href: "/pos/configuracion", icono: Settings, etiqueta: "Configuración", soloAdmin: true },
];

function ItemMenu({ href, icono: Icono, etiqueta, onClick }: { href: string; icono: React.ElementType; etiqueta: string; onClick?: () => void }) {
  const pathname = usePathname();
  const activo = pathname === href || (href !== "/pos" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        activo ? "bg-marca-suave text-marca" : "text-texto-suave hover:text-texto hover:bg-surface-hover"
      )}
    >
      <Icono className="h-5 w-5 flex-shrink-0" />
      {etiqueta}
    </Link>
  );
}

export function PosSidebar({ sesion }: { sesion: SesionPos }) {
  const router = useRouter();
  const [movilAbierto, setMovilAbierto] = useState(false);
  const items = MENU.filter((m) => !m.soloAdmin || sesion.rol === "ADMINISTRADOR");

  async function cerrarSesion() {
    await fetch("/api/pos/auth/logout", { method: "POST" });
    router.push("/pos/login");
    router.refresh();
  }

  const contenido = (
    <>
      <div className="p-5 border-b border-borde">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-marca flex items-center justify-center text-white flex-shrink-0">
            <Wine className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-texto text-sm leading-tight truncate">Vinos y Licores</div>
            <div className="text-xs text-texto-muy-suave">Punto de venta</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => (
          <ItemMenu key={item.href} {...item} onClick={() => setMovilAbierto(false)} />
        ))}
      </nav>

      <div className="border-t border-borde p-3">
        <div className="px-3 py-2 mb-1">
          <div className="text-sm font-medium text-texto truncate">{sesion.nombre}</div>
          <div className="text-xs text-texto-suave">{sesion.rol === "ADMINISTRADOR" ? "Administrador" : "Cajero"}</div>
        </div>
        <button
          onClick={cerrarSesion}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-peligro hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 h-dvh bg-surface border-r border-borde fixed left-0 top-0 z-30">
        {contenido}
      </aside>

      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-surface border-b border-borde px-4 py-3">
        <div className="flex items-center gap-2">
          <Wine className="h-5 w-5 text-marca" />
          <span className="font-bold text-sm">Punto de Venta</span>
        </div>
        <button onClick={() => setMovilAbierto(true)} aria-label="Abrir menú" className="p-2">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {movilAbierto && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMovilAbierto(false)} />
          <aside className="relative z-10 w-64 h-dvh bg-surface flex flex-col">
            <button onClick={() => setMovilAbierto(false)} className="absolute right-3 top-3 p-1" aria-label="Cerrar menú">
              <X className="h-5 w-5" />
            </button>
            {contenido}
          </aside>
        </div>
      )}
    </>
  );
}
