"use client";
import { useState } from "react";
import { Sparkles, Copy, CheckCheck } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import toast from "react-hot-toast";

const ACCIONES = [
  { id: "mensaje", etiqueta: "Redactar mensaje", emoji: "💬", desc: "WhatsApp o correo listo para enviar" },
  { id: "temperatura", etiqueta: "Clasificar temperatura", emoji: "🌡️", desc: "🔥 Caliente / 🟡 Tibio / 🔵 Frío" },
  { id: "accion", etiqueta: "Sugerir próxima acción", emoji: "📋", desc: "Qué hacer y para cuándo" },
  { id: "resumen", etiqueta: "Resumir expediente", emoji: "📄", desc: "La historia en 3-5 líneas" },
  { id: "objecion", etiqueta: "Manejar objeción", emoji: "🎯", desc: "Respuesta a lo que los frena" },
] as const;

interface PanelIAProps {
  clienteId: string;
  clienteNombre: string;
}

export function PanelIA({ clienteId, clienteNombre }: PanelIAProps) {
  const [accionActiva, setAccionActiva] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function ejecutar(accion: string) {
    setAccionActiva(accion);
    setCargando(true);
    setResultado(null);
    setAviso(null);
    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, clienteId }),
      });
      const json = await res.json();
      if (json.ok) {
        setResultado(json.respuesta);
        if (json.aviso) setAviso(json.aviso);
      } else {
        toast.error("No se pudo obtener respuesta del asistente");
      }
    } finally {
      setCargando(false);
    }
  }

  function copiar() {
    if (!resultado) return;
    navigator.clipboard.writeText(resultado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
    toast.success("¡Copiado!");
  }

  return (
    <Tarjeta className="border-marca/20 bg-marca-suave/30">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-marca" />
        <h2 className="font-semibold text-texto">Asistente IA — {clienteNombre}</h2>
      </div>

      {aviso && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
          💡 {aviso}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {ACCIONES.map((a) => (
          <Boton
            key={a.id}
            variante={accionActiva === a.id ? "primario" : "secundario"}
            tamano="sm"
            cargando={cargando && accionActiva === a.id}
            onClick={() => ejecutar(a.id)}
            className="flex-col h-auto py-3 gap-1"
          >
            <span className="text-base">{a.emoji}</span>
            <span className="text-xs text-center leading-tight">{a.etiqueta}</span>
          </Boton>
        ))}
      </div>

      {resultado && (
        <div className="mt-4">
          <div className="p-4 rounded-xl bg-surface border border-borde text-sm text-texto whitespace-pre-wrap leading-relaxed">
            {resultado}
          </div>
          <div className="flex gap-2 mt-2">
            <Boton variante="secundario" tamano="sm" icono={copiado ? <CheckCheck className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              onClick={copiar}>
              {copiado ? "¡Copiado!" : "Copiar"}
            </Boton>
          </div>
        </div>
      )}
    </Tarjeta>
  );
}
