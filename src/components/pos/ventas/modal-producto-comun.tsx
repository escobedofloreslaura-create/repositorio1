"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Campo } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";

export function ModalProductoComun({
  onCerrar,
  onAgregar,
}: {
  onCerrar: () => void;
  onAgregar: (descripcion: string, monto: number) => void;
}) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const montoNum = Number(monto);
    if (!descripcion.trim() || !montoNum || montoNum <= 0) return;
    onAgregar(descripcion.trim(), montoNum);
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Producto no registrado">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-texto-suave">
          Úsalo para vender algo que no está en el catálogo: ingresa una descripción y el monto a cobrar.
        </p>
        <Campo
          label="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej. hielo, bolsa, artículo vario"
          required
          autoFocus
        />
        <Campo
          label="Monto"
          type="number"
          min={0.01}
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="0.00"
          required
        />
        <div className="flex gap-2">
          <Boton type="button" variante="secundario" className="flex-1" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" variante="primario" className="flex-1">Agregar al ticket</Boton>
        </div>
      </form>
    </Modal>
  );
}
