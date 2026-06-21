"use client";
import { useState } from "react";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import toast from "react-hot-toast";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import QRCode from "qrcode";
import type { SesionUsuario } from "@/lib/auth";

interface Vendedor { id: string; nombre: string; paginaAgendaSlug: string | null; }
interface Config { nombre?: string | null; dominio?: string | null; }

export function CompartePanel({ vendedores, config, sesion }: {
  vendedores: Vendedor[];
  config: Config | null;
  sesion: SesionUsuario;
}) {
  const [utm, setUtm] = useState({ source: "whatsapp", medium: "referido", campaign: "" });
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const base = typeof window !== "undefined" ? window.location.origin : "";

  function urlAgenda(slug: string) {
    const params = new URLSearchParams({
      utm_source: utm.source,
      utm_medium: utm.medium,
      ...(utm.campaign ? { utm_campaign: utm.campaign } : {}),
    });
    return `${base}/agenda/${slug}?${params}`;
  }

  function urlLanding() {
    const params = new URLSearchParams({
      utm_source: utm.source,
      utm_medium: utm.medium,
      ...(utm.campaign ? { utm_campaign: utm.campaign } : {}),
    });
    return `${base}/landing?${params}`;
  }

  function copiar(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("¡Link copiado!");
  }

  async function generarQR(url: string) {
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    setQrUrl(dataUrl);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Tarjeta>
        <h2 className="font-semibold text-texto mb-4">🔗 Configurar UTM de rastreo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Campo label="Fuente" value={utm.source} onChange={(e) => setUtm((u) => ({ ...u, source: e.target.value }))} placeholder="whatsapp" />
          <Campo label="Medio" value={utm.medium} onChange={(e) => setUtm((u) => ({ ...u, medium: e.target.value }))} placeholder="referido" />
          <Campo label="Campaña" value={utm.campaign} onChange={(e) => setUtm((u) => ({ ...u, campaign: e.target.value }))} placeholder="promo-junio" />
        </div>
      </Tarjeta>

      <Tarjeta>
        <h2 className="font-semibold text-texto mb-1">🌐 Landing de captura</h2>
        <p className="text-xs text-texto-suave mb-4">Comparte este link para capturar leads directamente</p>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-fondo border border-borde text-sm text-texto-suave break-all">
          <span className="flex-1">{urlLanding()}</span>
        </div>
        <div className="flex gap-2 mt-3">
          <Boton variante="secundario" tamano="sm" icono={<Copy className="h-4 w-4" />} onClick={() => copiar(urlLanding())}>Copiar</Boton>
          <Boton variante="secundario" tamano="sm" icono={<QrCode className="h-4 w-4" />} onClick={() => generarQR(urlLanding())}>QR</Boton>
          <Boton variante="fantasma" tamano="sm" icono={<ExternalLink className="h-4 w-4" />} onClick={() => window.open(urlLanding(), "_blank")}>Abrir</Boton>
        </div>
      </Tarjeta>

      {vendedores.map((v) => {
        const slug = v.paginaAgendaSlug ?? v.id;
        const url = urlAgenda(slug);
        return (
          <Tarjeta key={v.id}>
            <h2 className="font-semibold text-texto mb-1">📅 Agenda de {v.nombre}</h2>
            <p className="text-xs text-texto-suave mb-4">El prospecto puede agendar directamente una cita de 45 min</p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-fondo border border-borde text-sm text-texto-suave break-all">
              <span className="flex-1">{url}</span>
            </div>
            <div className="flex gap-2 mt-3">
              <Boton variante="secundario" tamano="sm" icono={<Copy className="h-4 w-4" />} onClick={() => copiar(url)}>Copiar</Boton>
              <Boton variante="secundario" tamano="sm" icono={<QrCode className="h-4 w-4" />} onClick={() => generarQR(url)}>QR</Boton>
              <Boton variante="fantasma" tamano="sm" icono={<ExternalLink className="h-4 w-4" />} onClick={() => window.open(url, "_blank")}>Abrir</Boton>
            </div>
          </Tarjeta>
        );
      })}

      {qrUrl && (
        <Tarjeta>
          <h2 className="font-semibold text-texto mb-4">📱 Código QR</h2>
          <div className="flex flex-col items-center gap-4">
            <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-xl border border-borde" />
            <a href={qrUrl} download="qr-lefpatrimonial.png">
              <Boton variante="secundario" tamano="sm">Descargar QR</Boton>
            </a>
          </div>
        </Tarjeta>
      )}
    </div>
  );
}
