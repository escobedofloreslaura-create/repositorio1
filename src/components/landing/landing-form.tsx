"use client";
import { useState } from "react";
import toast from "react-hot-toast";

export function LandingForm() {
  const [form, setForm] = useState({ nombre: "", telefono: "", correo: "", mensaje: "" });
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.telefono) { toast.error("Nombre y teléfono son obligatorios"); return; }
    setCargando(true);
    try {
      const utmParams = new URLSearchParams(window.location.search);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          utm_source: utmParams.get("utm_source") ?? "",
          utm_medium: utmParams.get("utm_medium") ?? "",
          utm_campaign: utmParams.get("utm_campaign") ?? "",
          origen: utmParams.get("utm_source") ?? "landing",
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setEnviado(true);
      } else {
        toast.error("Hubo un problema. Por favor intenta de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  }

  if (enviado) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Listo!</h2>
        <p className="text-gray-600 mb-4">
          Recibimos tu información. Un asesor de LEF PATRIMONIAL te contactará en menos de 24 horas.
        </p>
        <p className="text-sm text-gray-400">Revisa tu WhatsApp o correo.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Solicita tu consulta</h2>
      <p className="text-gray-500 text-sm mb-6">Gratuita · Confidencial · Sin compromiso</p>
      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
          <input value={form.nombre} onChange={(e) => set("nombre", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            placeholder="Tu nombre" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Teléfono *</label>
          <input value={form.telefono} onChange={(e) => set("telefono", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            placeholder="+52 222 123 4567" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input type="email" value={form.correo} onChange={(e) => set("correo", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            placeholder="tu@correo.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿En qué te podemos ayudar?</label>
          <textarea value={form.mensaje} onChange={(e) => set("mensaje", e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
            placeholder="Seguros de vida, ahorro, inversión..." />
        </div>
        <button type="submit" disabled={cargando}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3.5 transition-colors text-sm">
          {cargando ? "Enviando..." : "Quiero mi consulta gratis →"}
        </button>
        <p className="text-xs text-gray-400 text-center">Al enviar aceptas que te contactemos por WhatsApp o correo.</p>
      </form>
    </div>
  );
}
