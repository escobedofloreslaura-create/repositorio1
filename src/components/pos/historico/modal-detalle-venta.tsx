"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/badge";
import { Campo } from "@/components/ui/campo";
import { formatearMoneda, formatearFechaHumana } from "@/lib/formato";
import { ETIQUETAS_FORMA_PAGO, type FormaPago } from "@/lib/pos/constantes";
import { imprimirTicketAutomatico } from "@/lib/pos/imprimir-ticket";
import { Printer } from "lucide-react";
import toast from "react-hot-toast";

interface DetalleVenta {
  id: string;
  descripcion: string;
  cantidad: number;
  cantidadDevuelta: number;
  precioUnitario: number;
  producto: { nombre: string } | null;
}

interface VentaDetalle {
  id: string;
  folio: number;
  fecha: string;
  total: number;
  estado: string;
  notas: string | null;
  detalles: DetalleVenta[];
  pagos: { forma: FormaPago; monto: number }[];
  devoluciones: { id: string }[];
  cliente: { nombre: string } | null;
  usuario: { nombre: string };
}

export function ModalDetalleVenta({ ventaId, onCerrar, onCambio }: { ventaId: string; onCerrar: () => void; onCambio: () => void }) {
  const [venta, setVenta] = useState<VentaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [devolviendo, setDevolviendo] = useState<DetalleVenta | null>(null);
  const [cantidadDevolver, setCantidadDevolver] = useState("1");
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);

  async function cargar() {
    setCargando(true);
    const res = await fetch(`/api/pos/ventas/${ventaId}`);
    const json = await res.json();
    if (json.ok) setVenta(json.data);
    setCargando(false);
  }

  async function reimprimir() {
    if (!venta) return;
    const res = await fetch("/api/pos/config");
    const json = await res.json();
    if (!json.ok) return toast.error("No se pudo cargar la configuración del ticket");
    const via = await imprimirTicketAutomatico(
      {
        folio: venta.folio,
        fecha: venta.fecha,
        cajero: venta.usuario.nombre,
        cliente: venta.cliente?.nombre ?? null,
        items: venta.detalles.map((d) => ({ descripcion: d.producto?.nombre ?? d.descripcion, cantidad: d.cantidad, precioUnitario: d.precioUnitario })),
        pagos: venta.pagos,
        total: venta.total,
        config: json.data,
      },
      json.data.impresora
    );
    if (via === "navegador" && json.data.impresora) {
      toast("No se pudo conectar con QZ Tray, se abrió el diálogo de impresión.", { icon: "⚠️" });
    }
  }

  useEffect(() => { cargar(); }, [ventaId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function cancelarVenta() {
    if (!confirm("¿Cancelar esta venta? Se reintegrará el stock y se descontará el dinero de la caja.")) return;
    setProcesando(true);
    try {
      const res = await fetch(`/api/pos/ventas/${ventaId}/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: prompt("Motivo de cancelación (opcional)") ?? undefined }),
      });
      const json = await res.json();
      if (!json.ok) return toast.error(json.error ?? "Error al cancelar");
      toast.success("Venta cancelada");
      onCambio();
      cargar();
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarDevolucion(e: React.FormEvent) {
    e.preventDefault();
    if (!devolviendo) return;
    setProcesando(true);
    try {
      const res = await fetch(`/api/pos/ventas/${ventaId}/devolucion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detalleVentaId: devolviendo.id, cantidad: Number(cantidadDevolver), motivo }),
      });
      const json = await res.json();
      if (!json.ok) return toast.error(json.error ?? "Error al devolver");
      toast.success("Devolución registrada");
      setDevolviendo(null);
      setMotivo("");
      onCambio();
      cargar();
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={venta ? `Venta #${venta.folio}` : "Venta"} tamano="lg">
      {cargando || !venta ? (
        <p className="text-sm text-texto-suave">Cargando…</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variante={venta.estado === "CANCELADA" ? "peligro" : "exito"}>{venta.estado}</Badge>
            <span className="text-sm text-texto-suave">{formatearFechaHumana(venta.fecha)}</span>
          </div>
          <p className="text-sm text-texto-suave">
            Cajero: {venta.usuario.nombre} {venta.cliente && `· Cliente: ${venta.cliente.nombre}`}
          </p>

          <div className="rounded-xl border border-borde divide-y divide-borde">
            {venta.detalles.map((d) => {
              const disponible = d.cantidad - d.cantidadDevuelta;
              return (
                <div key={d.id} className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <div className="font-medium text-texto">{d.producto?.nombre ?? d.descripcion}</div>
                    <div className="text-xs text-texto-suave">
                      {d.cantidad} x {formatearMoneda(d.precioUnitario)}
                      {d.cantidadDevuelta > 0 && <span className="text-peligro"> · devuelto {d.cantidadDevuelta}</span>}
                    </div>
                  </div>
                  {venta.estado === "COMPLETADA" && disponible > 0 && (
                    <button
                      onClick={() => { setDevolviendo(d); setCantidadDevolver("1"); }}
                      className="text-xs font-medium text-marca hover:underline"
                    >
                      Devolver
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {venta.pagos.map((p, i) => (
              <Badge key={i} variante="neutro">{ETIQUETAS_FORMA_PAGO[p.forma]}: {formatearMoneda(p.monto)}</Badge>
            ))}
          </div>

          <Boton variante="secundario" className="w-full" icono={<Printer className="h-4 w-4" />} onClick={reimprimir}>
            Reimprimir ticket
          </Boton>

          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatearMoneda(venta.total)}</span>
          </div>

          {venta.estado === "COMPLETADA" && venta.devoluciones.length === 0 && (
            <Boton variante="peligro" className="w-full" cargando={procesando} onClick={cancelarVenta}>
              Cancelar venta completa
            </Boton>
          )}
          {venta.estado === "COMPLETADA" && venta.devoluciones.length > 0 && (
            <p className="text-xs text-texto-suave text-center">
              Esta venta ya tiene devoluciones parciales, por lo que no puede cancelarse por completo.
            </p>
          )}
        </div>
      )}

      {devolviendo && (
        <Modal abierto onCerrar={() => setDevolviendo(null)} titulo={`Devolver: ${devolviendo.producto?.nombre ?? devolviendo.descripcion}`}>
          <form onSubmit={confirmarDevolucion} className="space-y-4">
            <Campo
              label="Cantidad a devolver"
              type="number"
              min={1}
              max={devolviendo.cantidad - devolviendo.cantidadDevuelta}
              value={cantidadDevolver}
              onChange={(e) => setCantidadDevolver(e.target.value)}
              required
              autoFocus
            />
            <Campo label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Opcional" />
            <div className="flex gap-2">
              <Boton type="button" variante="secundario" className="flex-1" onClick={() => setDevolviendo(null)}>Cancelar</Boton>
              <Boton type="submit" variante="primario" className="flex-1" cargando={procesando}>Confirmar devolución</Boton>
            </div>
          </form>
        </Modal>
      )}
    </Modal>
  );
}
