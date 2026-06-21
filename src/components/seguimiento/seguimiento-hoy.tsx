"use client";
import { useRouter } from "next/navigation";
import { TemperaturaBadge } from "@/components/ui/temperatura-badge";
import { LinkCliente } from "@/components/layout/link-cliente";
import { Tarjeta } from "@/components/ui/tarjeta";
import { EmptyState } from "@/components/ui/empty-state";
import { telefonoWhatsApp } from "@/lib/formato";
import { MessageCircle } from "lucide-react";
import type { SesionUsuario } from "@/lib/auth";

interface ClienteSeg {
  id: string;
  nombre: string;
  telefono: string | null;
  etapa: string;
  temperatura: string;
  proximaAccion: string | null;
  proximaAccionFecha: Date | string | null;
  vendedor: { nombre: string } | null;
}

function FilaCliente({ c, sesion }: { c: ClienteSeg; sesion: SesionUsuario }) {
  const wa = c.telefono ? `https://wa.me/${telefonoWhatsApp(c.telefono)}?text=${encodeURIComponent(`Hola ${c.nombre}, `)}` : null;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-borde last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <LinkCliente id={c.id} nombre={c.nombre} className="text-sm" />
          <TemperaturaBadge temperatura={c.temperatura} />
        </div>
        <div className="flex gap-3 mt-0.5 text-xs text-texto-suave flex-wrap">
          <span>{c.etapa}</span>
          {c.proximaAccion && <span>{c.proximaAccion}</span>}
          {c.proximaAccionFecha && <span>{new Date(c.proximaAccionFecha).toLocaleDateString("es-MX")}</span>}
          {sesion.rol === "ADMIN" && c.vendedor && <span>{c.vendedor.nombre}</span>}
        </div>
      </div>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer"
          className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
          <MessageCircle className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

export function SeguimientoHoy({ vencidos, hoy, sinAccion, sesion }: {
  vencidos: ClienteSeg[];
  hoy: ClienteSeg[];
  sinAccion: ClienteSeg[];
  sesion: SesionUsuario;
}) {
  const router = useRouter();
  const total = vencidos.length + hoy.length;

  return (
    <div className="max-w-3xl space-y-6">
      {total === 0 && sinAccion.length === 0 && (
        <EmptyState titulo="¡Todo al día! 🎉" descripcion="No tienes pendientes de seguimiento hoy." accion={{ etiqueta: "Ver clientes", onClick: () => router.push("/clientes") }} />
      )}

      {vencidos.length > 0 && (
        <Tarjeta className="border-peligro/30 bg-red-50/30">
          <h2 className="font-semibold text-peligro mb-1">⚠️ Vencidos — {vencidos.length}</h2>
          <p className="text-xs text-texto-suave mb-3">Estos ya pasaron su fecha de acción</p>
          {vencidos.map((c) => <FilaCliente key={c.id} c={c} sesion={sesion} />)}
        </Tarjeta>
      )}

      {hoy.length > 0 && (
        <Tarjeta className="border-marca/30">
          <h2 className="font-semibold text-texto mb-1">📋 Para hoy — {hoy.length}</h2>
          <p className="text-xs text-texto-suave mb-3">Estos tienen acción programada para hoy</p>
          {hoy.map((c) => <FilaCliente key={c.id} c={c} sesion={sesion} />)}
        </Tarjeta>
      )}

      {sinAccion.length > 0 && (
        <Tarjeta>
          <h2 className="font-semibold text-texto mb-1">❓ Sin próxima acción — {sinAccion.length}</h2>
          <p className="text-xs text-texto-suave mb-3">Define qué hacer con ellos</p>
          {sinAccion.map((c) => <FilaCliente key={c.id} c={c} sesion={sesion} />)}
        </Tarjeta>
      )}
    </div>
  );
}
