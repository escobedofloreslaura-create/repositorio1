"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Campo, Select } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import toast from "react-hot-toast";
import type { PosProductoT } from "@/lib/pos/tipos";

export function ModalMovimiento({
  producto,
  soloEntrada = false,
  onCerrar,
  onRegistrado,
}: {
  producto: PosProductoT;
  /** El cajero solo puede recibir mercancía de un proveedor: sin salidas, ajustes, ni existencia mínima. */
  soloEntrada?: boolean;
  onCerrar: () => void;
  onRegistrado: () => void;
}) {
  const [tipo, setTipo] = useState<"ENTRADA" | "SALIDA" | "AJUSTE">("ENTRADA");
  const [cantidad, setCantidad] = useState("");
  const [nuevaExistencia, setNuevaExistencia] = useState(producto.existencia.toString());
  const [detalle, setDetalle] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`/api/pos/productos/${producto.id}/movimiento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          tipo === "AJUSTE" ? { tipo, nuevaExistencia: Number(nuevaExistencia), detalle } : { tipo, cantidad: Number(cantidad), detalle }
        ),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Error al registrar el movimiento");
        return;
      }
      toast.success("Movimiento de inventario registrado");
      onRegistrado();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={soloEntrada ? `Entrada de mercancía · ${producto.nombre}` : `Movimiento de inventario · ${producto.nombre}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-texto-suave">Existencia actual: <strong>{producto.existencia}</strong></p>
        {soloEntrada ? (
          <p className="text-sm text-texto">Registra la cantidad que acabas de recibir del proveedor.</p>
        ) : (
          <Select
            label="Tipo de movimiento"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            opciones={[
              { valor: "ENTRADA", etiqueta: "Entrada (compra / reabasto)" },
              { valor: "SALIDA", etiqueta: "Salida (merma / uso interno)" },
              { valor: "AJUSTE", etiqueta: "Ajuste a una existencia exacta" },
            ]}
          />
        )}
        {tipo === "AJUSTE" ? (
          <Campo label="Nueva existencia" type="number" min={0} required value={nuevaExistencia} onChange={(e) => setNuevaExistencia(e.target.value)} autoFocus />
        ) : (
          <Campo label="Cantidad" type="number" min={0.01} step="0.01" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} autoFocus />
        )}
        <Campo label="Detalle / motivo" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Opcional" />
        {error && <p className="text-sm text-peligro">{error}</p>}
        <div className="flex gap-2">
          <Boton type="button" variante="secundario" className="flex-1" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" variante="primario" className="flex-1" cargando={cargando}>Registrar</Boton>
        </div>
      </form>
    </Modal>
  );
}
