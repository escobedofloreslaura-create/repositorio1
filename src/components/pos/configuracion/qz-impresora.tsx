"use client";
import { useState } from "react";
import { Boton } from "@/components/ui/boton";
import { Select } from "@/components/ui/campo";
import { Badge } from "@/components/ui/badge";
import { Printer, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { qzListarImpresoras } from "@/lib/pos/qz";
import { imprimirTicketAutomatico } from "@/lib/pos/imprimir-ticket";

interface Props {
  impresora: string | null;
  onCambiar: (impresora: string | null) => void;
}

export function QzImpresora({ impresora, onCambiar }: Props) {
  const [impresoras, setImpresoras] = useState<string[]>([]);
  const [estado, setEstado] = useState<"desconocido" | "conectado" | "no_disponible">("desconocido");
  const [buscando, setBuscando] = useState(false);
  const [probando, setProbando] = useState(false);

  async function detectar() {
    setBuscando(true);
    try {
      const lista = await qzListarImpresoras();
      setImpresoras(lista);
      setEstado("conectado");
      toast.success(`QZ Tray conectado: ${lista.length} impresora(s) encontrada(s)`);
    } catch (e) {
      console.error(e);
      setEstado("no_disponible");
      toast.error("No se pudo conectar con QZ Tray. ¿Está instalado y corriendo?");
    } finally {
      setBuscando(false);
    }
  }

  async function imprimirPrueba() {
    if (!impresora) return;
    setProbando(true);
    try {
      const via = await imprimirTicketAutomatico(
        {
          folio: 0,
          fecha: new Date(),
          cajero: "Prueba",
          items: [{ descripcion: "Producto de prueba", cantidad: 1, precioUnitario: 10 }],
          pagos: [{ forma: "EFECTIVO", monto: 10 }],
          total: 10,
          config: {
            nombreNegocio: "Ticket de prueba",
            mensajeTicket: "Esto es una impresión de prueba",
            simboloMoneda: "$",
          },
        },
        impresora
      );
      if (via === "qz") toast.success("Ticket de prueba enviado a la impresora");
      else toast("Se abrió el diálogo del navegador (QZ Tray no respondió)", { icon: "⚠️" });
    } finally {
      setProbando(false);
    }
  }

  return (
    <div className="rounded-xl border border-borde p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Printer className="h-4 w-4 text-marca" />
          <span className="text-sm font-medium text-texto">Impresora térmica (QZ Tray)</span>
        </div>
        {estado === "conectado" && <Badge variante="exito">Conectado</Badge>}
        {estado === "no_disponible" && <Badge variante="peligro">No disponible</Badge>}
      </div>

      <p className="text-xs text-texto-suave">
        Para imprimir tickets automáticamente, sin el diálogo del navegador, instala{" "}
        <a href="https://qz.io/download/" target="_blank" rel="noreferrer" className="text-marca underline">
          QZ Tray
        </a>{" "}
        en la computadora de la caja y déjalo corriendo. La primera vez que imprimas, QZ Tray pedirá confirmar el
        acceso del sitio — marca &quot;recordar esta decisión&quot; para que no vuelva a preguntar.
      </p>

      <div className="flex gap-2">
        <Boton type="button" variante="secundario" tamano="sm" icono={<RefreshCw className="h-3.5 w-3.5" />} cargando={buscando} onClick={detectar}>
          Detectar impresoras
        </Boton>
        {impresora && (
          <Boton type="button" variante="secundario" tamano="sm" cargando={probando} onClick={imprimirPrueba}>
            Imprimir prueba
          </Boton>
        )}
      </div>

      {impresoras.length > 0 ? (
        <Select
          label="Impresora seleccionada"
          value={impresora ?? ""}
          onChange={(e) => onCambiar(e.target.value || null)}
          opciones={[{ valor: "", etiqueta: "Sin seleccionar" }, ...impresoras.map((p) => ({ valor: p, etiqueta: p }))]}
        />
      ) : (
        impresora && (
          <p className="text-xs text-texto-suave">
            Impresora guardada: <strong>{impresora}</strong> (detecta de nuevo para cambiarla)
          </p>
        )
      )}
    </div>
  );
}
