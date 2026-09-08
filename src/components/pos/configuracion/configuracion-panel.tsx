"use client";
import { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";
import { Campo, Textarea } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { QzImpresora } from "./qz-impresora";
import toast from "react-hot-toast";

interface Config {
  nombreNegocio: string;
  direccion: string | null;
  telefono: string | null;
  rfc: string | null;
  mensajeTicket: string;
  logoUrl: string | null;
  impresora: string | null;
  moneda: string;
  simboloMoneda: string;
}

// Reduce la imagen a un tamaño razonable para guardarla como base64 en la
// configuración (el ticket solo necesita un logo pequeño).
function redimensionarImagen(archivo: File, anchoMax = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
      img.onload = () => {
        const escala = Math.min(1, anchoMax / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * escala;
        canvas.height = img.height * escala;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No se pudo procesar la imagen"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = lector.result as string;
    };
    lector.readAsDataURL(archivo);
  });
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

  async function subirLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen");
      return;
    }
    try {
      const dataUrl = await redimensionarImagen(archivo);
      set("logoUrl", dataUrl);
    } catch {
      toast.error("No se pudo procesar la imagen");
    }
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-texto">Logo del negocio</label>
          <p className="text-xs text-texto-suave">Aparece en la parte superior del ticket impreso.</p>
          <div className="flex items-center gap-3">
            {config.logoUrl && (
              <div className="relative">
                <img src={config.logoUrl} alt="Logo del negocio" className="h-16 w-16 rounded-lg border border-borde object-contain bg-white" />
                <button
                  type="button"
                  onClick={() => set("logoUrl", null)}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-surface border border-borde p-0.5 text-texto-suave hover:text-peligro"
                  title="Quitar logo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <label className="inline-flex items-center gap-2 rounded-xl border border-borde px-3 py-2 text-sm font-medium text-texto cursor-pointer hover:bg-surface-hover">
              <Upload className="h-4 w-4" />
              {config.logoUrl ? "Cambiar logo" : "Subir logo"}
              <input type="file" accept="image/*" className="hidden" onChange={subirLogo} />
            </label>
          </div>
        </div>

        <Campo label="Dirección" value={config.direccion ?? ""} onChange={(e) => set("direccion", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Teléfono" value={config.telefono ?? ""} onChange={(e) => set("telefono", e.target.value)} />
          <Campo label="RFC" value={config.rfc ?? ""} onChange={(e) => set("rfc", e.target.value)} />
        </div>
        <Textarea label="Mensaje en el ticket" value={config.mensajeTicket} onChange={(e) => set("mensajeTicket", e.target.value)} />
        <QzImpresora impresora={config.impresora} onCambiar={(v) => set("impresora", v)} />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Moneda" value={config.moneda} onChange={(e) => set("moneda", e.target.value)} />
          <Campo label="Símbolo" value={config.simboloMoneda} onChange={(e) => set("simboloMoneda", e.target.value)} />
        </div>
        <Boton type="submit" variante="primario" cargando={cargando}>Guardar cambios</Boton>
      </form>
    </div>
  );
}
