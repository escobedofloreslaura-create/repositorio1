"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { EmptyState } from "@/components/ui/empty-state";
import { EstadoBadge } from "@/components/ui/estado-badge";
import toast from "react-hot-toast";
import { RotateCcw } from "lucide-react";
import type { SesionUsuario } from "@/lib/auth";

interface ClienteEliminado {
  id: string;
  nombre: string;
  etapa: string;
  estado: string;
  temperatura: string;
  eliminadoEn: Date | string | null;
}

export function PapeleraLista({ eliminados, sesion }: { eliminados: ClienteEliminado[]; sesion: SesionUsuario }) {
  const router = useRouter();
  const [restaurando, setRestaurando] = useState<string | null>(null);

  async function restaurar(id: string) {
    setRestaurando(id);
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurar: true }),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error ?? "Error"); return; }
      toast.success("Cliente restaurado");
      router.refresh();
    } finally {
      setRestaurando(null);
    }
  }

  if (eliminados.length === 0) {
    return <EmptyState titulo="Papelera vacía" descripcion="Los clientes eliminados aparecen aquí durante 30 días." />;
  }

  return (
    <div className="max-w-3xl space-y-3">
      {eliminados.map((c) => (
        <Tarjeta key={c.id} className="opacity-75">
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-texto">{c.nombre}</span>
                <EstadoBadge estado={c.estado} />
              </div>
              <div className="flex gap-3 mt-0.5 text-xs text-texto-suave">
                <span>{c.etapa}</span>
                {c.eliminadoEn && (
                  <span>Eliminado {new Date(c.eliminadoEn).toLocaleDateString("es-MX")}</span>
                )}
              </div>
            </div>
            <Boton
              variante="secundario"
              tamano="sm"
              icono={<RotateCcw className="h-4 w-4" />}
              cargando={restaurando === c.id}
              onClick={() => restaurar(c.id)}
            >
              Restaurar
            </Boton>
          </div>
        </Tarjeta>
      ))}
    </div>
  );
}
