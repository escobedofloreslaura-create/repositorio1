"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, KanbanSquare, CalendarDays, Wallet, ListChecks,
  Trophy, XCircle, Archive, CalendarPlus, UserCog, Share2, ShieldCheck,
  LogOut, User, Settings, HelpCircle, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { iniciales } from "@/lib/formato";
import { useState } from "react";
import { SelectorTema } from "@/components/ui/selector-tema";
import type { SesionUsuario } from "@/lib/auth";

const MENU_PRINCIPAL = [
  { href: "/dashboard", icono: LayoutDashboard, etiqueta: "Tablero", color: "text-marca" },
  { href: "/clientes", icono: Users, etiqueta: "Clientes", color: "text-blue-500" },
  { href: "/embudo", icono: KanbanSquare, etiqueta: "Embudo", color: "text-indigo-500" },
  { href: "/agenda", icono: CalendarDays, etiqueta: "Agenda", color: "text-green-500" },
  { href: "/pagos", icono: Wallet, etiqueta: "Pagos", color: "text-emerald-500" },
  { href: "/seguimiento", icono: ListChecks, etiqueta: "Seguimiento", color: "text-amber-500" },
];

const MENU_SECUNDARIO = [
  { href: "/completados", icono: Trophy, etiqueta: "Completados", color: "text-emerald-600" },
  { href: "/perdidos", icono: XCircle, etiqueta: "Perdidos", color: "text-slate-500" },
  { href: "/archivados", icono: Archive, etiqueta: "Archivados", color: "text-stone-500" },
  { href: "/equipo", icono: UserCog, etiqueta: "Equipo", color: "text-cyan-500" },
  { href: "/comparte", icono: Share2, etiqueta: "Comparte y Crece", color: "text-marca" },
];

function ItemMenu({ href, icono: Icono, etiqueta, color }: { href: string; icono: React.ElementType; etiqueta: string; color: string }) {
  const pathname = usePathname();
  const activo = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        activo
          ? "bg-marca-suave text-marca"
          : "text-texto-suave hover:text-texto hover:bg-surface-hover"
      )}
    >
      <Icono className={cn("h-5 w-5 flex-shrink-0", activo ? "text-marca" : color)} />
      {etiqueta}
    </Link>
  );
}

export function Sidebar({ sesion }: { sesion: SesionUsuario }) {
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);

  async function cerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 h-dvh bg-surface border-r border-borde fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-5 border-b border-borde">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-marca flex items-center justify-center text-white font-bold text-sm">LP</div>
          <div>
            <div className="font-bold text-texto text-sm leading-tight">LEF PATRIMONIAL</div>
            <div className="text-xs text-texto-muy-suave">CRM de ventas</div>
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {MENU_PRINCIPAL.map((item) => <ItemMenu key={item.href} {...item} />)}

        <div className="pt-2 pb-1">
          <div className="text-xs font-semibold text-texto-muy-suave px-3 py-1 uppercase tracking-wider">Cartera</div>
        </div>
        {MENU_SECUNDARIO.map((item) => <ItemMenu key={item.href} {...item} />)}

        {sesion.rol === "ADMIN" && (
          <>
            <div className="pt-2 pb-1">
              <div className="text-xs font-semibold text-texto-muy-suave px-3 py-1 uppercase tracking-wider">Admin</div>
            </div>
            <ItemMenu href="/admin" icono={ShieldCheck} etiqueta="Panel Admin" color="text-marca" />
            <ItemMenu href="/configuracion" icono={Settings} etiqueta="Configuración" color="text-texto-suave" />
          </>
        )}
      </nav>

      {/* Avatar y menú del usuario */}
      <div className="border-t border-borde p-3">
        <div className="relative">
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors text-left"
          >
            <div className="h-8 w-8 rounded-full bg-marca-suave text-marca flex items-center justify-center text-sm font-bold flex-shrink-0">
              {iniciales(sesion.nombre)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-texto truncate">{sesion.nombre}</div>
              <div className="text-xs text-texto-suave">{sesion.rol === "ADMIN" ? "Administrador" : "Vendedor"}</div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-texto-suave transition-transform", menuAbierto && "rotate-180")} />
          </button>

          {menuAbierto && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-borde rounded-xl shadow-lg overflow-hidden">
              <Link href="/perfil" onClick={() => setMenuAbierto(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-hover transition-colors">
                <User className="h-4 w-4 text-texto-suave" /> Mi Perfil
              </Link>
              {sesion.rol === "ADMIN" && (
                <Link href="/configuracion" onClick={() => setMenuAbierto(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-hover transition-colors">
                  <Settings className="h-4 w-4 text-texto-suave" /> Configuración
                </Link>
              )}
              <div className="px-4 py-2.5 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-texto-suave" />
                <span className="text-sm">Ayuda</span>
                <SelectorTema compact />
              </div>
              <hr className="border-borde" />
              <button onClick={cerrarSesion} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-peligro hover:bg-red-50 transition-colors">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
