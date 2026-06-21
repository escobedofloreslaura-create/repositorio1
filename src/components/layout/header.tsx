"use client";
import { useState, useCallback } from "react";
import { Search, Bell, HelpCircle } from "lucide-react";
import { SelectorTema } from "@/components/ui/selector-tema";
import { BuscadorGlobal } from "@/components/buscador/buscador-global";
import type { SesionUsuario } from "@/lib/auth";

interface HeaderProps {
  titulo: string;
  subtitulo?: string;
  sesion: SesionUsuario;
}

export function Header({ titulo, subtitulo, sesion }: HeaderProps) {
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);

  const abrirBuscador = useCallback(() => setBuscadorAbierto(true), []);

  return (
    <>
      <header className="sticky top-0 z-20 glass border-b border-borde px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-texto truncate">{titulo}</h1>
            {subtitulo && <p className="text-xs text-texto-suave">{subtitulo}</p>}
          </div>

          {/* Buscador — escritorio */}
          <button
            onClick={abrirBuscador}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-borde bg-fondo text-texto-suave text-sm hover:bg-surface-hover transition-colors w-56"
          >
            <Search className="h-4 w-4 flex-shrink-0" />
            <span>Buscar... (Ctrl+K)</span>
          </button>

          {/* Buscador — móvil */}
          <button
            onClick={abrirBuscador}
            className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl border border-borde text-texto-suave hover:bg-surface-hover"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Campanita */}
          <button className="relative h-9 w-9 flex items-center justify-center rounded-xl border border-borde text-texto-suave hover:bg-surface-hover transition-colors">
            <Bell className="h-4 w-4" />
          </button>

          {/* Tema */}
          <div className="hidden md:block">
            <SelectorTema compact />
          </div>

          {/* Ayuda */}
          <button className="h-9 w-9 flex items-center justify-center rounded-xl border border-borde text-texto-suave hover:bg-surface-hover transition-colors" aria-label="Ayuda">
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </header>

      <BuscadorGlobal abierto={buscadorAbierto} onCerrar={() => setBuscadorAbierto(false)} />
    </>
  );
}
