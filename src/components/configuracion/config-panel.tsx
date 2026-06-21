"use client";
import { useState } from "react";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import toast from "react-hot-toast";

interface Config {
  id?: string;
  nombre?: string | null;
  metaMensualDinero?: number | null;
  metaMensualClientes?: number | null;
  mensajeWhatsApp?: string | null;
}

export function ConfigPanel({ config: inicial }: { config: Config | null }) {
  const [form, setForm] = useState({
    nombre: inicial?.nombre ?? "LEF PATRIMONIAL",
    metaMensual: String(inicial?.metaMensualDinero ?? 100000),
    metaClientes: String(inicial?.metaMensualClientes ?? 10),
    mensajeWhatsApp: inicial?.mensajeWhatsApp ?? "Hola {nombre}, gracias por tu interés. ¿Te late si agendamos una llamada?",
  });
  const [cargando, setCargando] = useState(false);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          metaMensualDinero: Number(form.metaMensual),
          metaMensualClientes: Number(form.metaClientes),
          mensajeWhatsApp: form.mensajeWhatsApp,
        }),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error ?? "Error"); return; }
      toast.success("Configuración guardada");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-lg">
      <Tarjeta>
        <h2 className="font-semibold text-texto mb-6">Configuración del negocio</h2>
        <form onSubmit={guardar} className="space-y-4">
          <Campo label="Nombre del negocio" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Meta mensual ($)" type="number" value={form.metaMensual} onChange={(e) => set("metaMensual", e.target.value)} />
            <Campo label="Meta de clientes" type="number" value={form.metaClientes} onChange={(e) => set("metaClientes", e.target.value)} />
          </div>
          <Campo label="Mensaje de WhatsApp" value={form.mensajeWhatsApp} onChange={(e) => set("mensajeWhatsApp", e.target.value)} placeholder="Hola {nombre}..." />
          <p className="text-xs text-texto-suave">Variables: {"{nombre}"}</p>
          <Boton type="submit" cargando={cargando} className="mt-2">Guardar configuración</Boton>
        </form>
      </Tarjeta>
    </div>
  );
}
