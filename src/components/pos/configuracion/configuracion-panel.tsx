"use client";
import { useEffect, useState } from "react";
import { Campo, Textarea } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import toast from "react-hot-toast";

interface Config {
  nombreNegocio: string;
  direccion: string | null;
  telefono: string | null;
  rfc: string | null;
  mensajeTicket: string;
  impresora: string | null;
  moneda: string;
  simboloMoneda: string;
}

export function ConfiguracionPanel() {
  const [config, setConfig] = useState<Config | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    fetch("/api/pos/config")
      .then((r) => r.json())
      .then((json) => { if (json.ok) setConfig(json.data); });
  }, []);

  function set<K extends keyof Config>(campo: K, valor: Config[K]) {
    setConfig((c) => (c ? { ...c, [campo]: valor } : c));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setCargando(true);
    try {
      const res = await fetch("/api/pos/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (!json.ok) return toast.error(json.error ?? "Error al guardar");
      toast.success("Configuración guardada");
    } finally {
      setCargando(false);
    }
  }

  if (!config) return <p className="p-6 text-sm text-texto-suave">Cargando…</p>;

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-texto mb-6">Configuración</h1>
      <form onSubmit={guardar} className="space-y-4">
        <Campo label="Nombre del negocio" value={config.nombreNegocio} onChange={(e) => set("nombreNegocio", e.target.value)} required />
        <Campo label="Dirección" value={config.direccion ?? ""} onChange={(e) => set("direccion", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Teléfono" value={config.telefono ?? ""} onChange={(e) => set("telefono", e.target.value)} />
          <Campo label="RFC" value={config.rfc ?? ""} onChange={(e) => set("rfc", e.target.value)} />
        </div>
        <Textarea label="Mensaje en el ticket" value={config.mensajeTicket} onChange={(e) => set("mensajeTicket", e.target.value)} />
        <Campo label="Nombre de la impresora" value={config.impresora ?? ""} onChange={(e) => set("impresora", e.target.value)} placeholder="Ej. EPSON TM-T20" />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Moneda" value={config.moneda} onChange={(e) => set("moneda", e.target.value)} />
          <Campo label="Símbolo" value={config.simboloMoneda} onChange={(e) => set("simboloMoneda", e.target.value)} />
        </div>
        <Boton type="submit" variante="primario" cargando={cargando}>Guardar cambios</Boton>
      </form>
    </div>
  );
}
