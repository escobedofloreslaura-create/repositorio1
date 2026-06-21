"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Campo, Select, Textarea } from "@/components/ui/campo";
import toast from "react-hot-toast";
import { Plus, Copy, Trash2 } from "lucide-react";
import type { SesionUsuario } from "@/lib/auth";

interface Plantilla {
  id: string;
  nombre: string;
  tipo: string;
  cuerpo: string;
}

export function PlantillasLista({ plantillas: inicial, sesion }: { plantillas: Plantilla[]; sesion: SesionUsuario }) {
  const router = useRouter();
  const [plantillas, setPlantillas] = useState(inicial);
  const [modal, setModal] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [form, setForm] = useState({ nombre: "", tipo: "whatsapp", cuerpo: "" });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.cuerpo) { toast.error("Nombre y contenido son obligatorios"); return; }
    setCargando(true);
    try {
      const res = await fetch("/api/plantillas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error ?? "Error"); return; }
      setPlantillas((prev) => [...prev, json.data]);
      toast.success("Plantilla creada");
      setModal(false);
      setForm({ nombre: "", tipo: "whatsapp", cuerpo: "" });
    } finally {
      setCargando(false);
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    await fetch(`/api/plantillas/${id}`, { method: "DELETE" });
    setPlantillas((prev) => prev.filter((p) => p.id !== id));
    toast.success("Plantilla eliminada");
  }

  const tipoOpc = [
    { valor: "whatsapp", etiqueta: "💬 WhatsApp" },
    { valor: "correo", etiqueta: "📧 Correo" },
    { valor: "sms", etiqueta: "📱 SMS" },
  ];

  const grupos = Array.from(new Set(plantillas.map((p) => p.tipo)));

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex justify-end">
        <Boton icono={<Plus className="h-4 w-4" />} onClick={() => setModal(true)}>Nueva plantilla</Boton>
      </div>

      {plantillas.length === 0 ? (
        <EmptyState titulo="Sin plantillas" descripcion="Crea tu primera plantilla de mensaje." accion={{ etiqueta: "+ Nueva", onClick: () => setModal(true) }} />
      ) : (
        grupos.map((tipo) => (
          <div key={tipo}>
            <h3 className="text-sm font-semibold text-texto-suave uppercase tracking-wide mb-3">
              {tipo === "whatsapp" ? "💬 WhatsApp" : tipo === "correo" ? "📧 Correo" : "📱 SMS"}
            </h3>
            <div className="space-y-3">
              {plantillas.filter((p) => p.tipo === tipo).map((p) => (
                <Tarjeta key={p.id} className="group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-texto text-sm">{p.nombre}</h4>
                      <p className="text-xs text-texto-suave mt-1 whitespace-pre-wrap line-clamp-3">{p.cuerpo}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => { navigator.clipboard.writeText(p.cuerpo); toast.success("¡Copiado!"); }}
                        className="p-1.5 rounded-lg hover:bg-surface-hover text-texto-suave transition-colors">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {sesion.rol === "ADMIN" && (
                        <button onClick={() => eliminar(p.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </Tarjeta>
              ))}
            </div>
          </div>
        ))
      )}

      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo="Nueva plantilla">
        <form onSubmit={crear} className="space-y-4">
          <Campo label="Nombre *" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Seguimiento inicial" />
          <Select label="Tipo" opciones={tipoOpc} value={form.tipo} onChange={(e) => set("tipo", e.target.value)} />
          <Textarea label="Contenido *" value={form.cuerpo} onChange={(e) => set("cuerpo", e.target.value)}
            placeholder="Hola {nombre}, te escribo de LEF PATRIMONIAL..." rows={5} />
          <p className="text-xs text-texto-suave">Variables: {"{nombre}"}, {"{etapa}"}, {"{valorEstimado}"}</p>
          <div className="flex gap-3 pt-2">
            <Boton type="submit" cargando={cargando}>Crear</Boton>
            <Boton type="button" variante="secundario" onClick={() => setModal(false)}>Cancelar</Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
