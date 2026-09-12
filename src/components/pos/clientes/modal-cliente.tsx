"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Campo, Select } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import toast from "react-hot-toast";
import type { PosClienteT } from "@/lib/pos/tipos";
import { ETIQUETAS_TIPO_PRECIO_CLIENTE, type TipoPrecioCliente } from "@/lib/pos/constantes";

export function ModalCliente({ cliente, onCerrar, onGuardado }: { cliente: PosClienteT | null; onCerrar: () => void; onGuardado: () => void }) {
  const [nombre, setNombre] = useState(cliente?.nombre ?? "");
  const [direccion, setDireccion] = useState(cliente?.direccion ?? "");
  const [telefono, setTelefono] = useState(cliente?.telefono ?? "");
  const [limiteCredito, setLimiteCredito] = useState(cliente?.limiteCredito?.toString() ?? "0");
  const [tipoPrecio, setTipoPrecio] = useState<TipoPrecioCliente>(cliente?.tipoPrecio ?? "VENTA");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const res = await fetch(cliente ? `/api/pos/clientes/${cliente.id}` : "/api/pos/clientes", {
        method: cliente ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, direccion, telefono, limiteCredito, tipoPrecio }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Error al guardar");
        return;
      }
      toast.success(cliente ? "Cliente actualizado" : "Cliente creado");
      onGuardado();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={cliente ? "Editar cliente" : "Nuevo cliente"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Campo label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
        <Campo label="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        <Campo label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        <Campo label="Límite de crédito" type="number" min={0} step="0.01" value={limiteCredito} onChange={(e) => setLimiteCredito(e.target.value)} />
        <Select
          label="Tipo de precio"
          value={tipoPrecio}
          onChange={(e) => setTipoPrecio(e.target.value as TipoPrecioCliente)}
          opciones={Object.entries(ETIQUETAS_TIPO_PRECIO_CLIENTE).map(([valor, etiqueta]) => ({ valor, etiqueta }))}
        />
        <p className="text-xs text-texto-suave -mt-2">
          Al vender a este cliente en el punto de venta, el precio se aplicará en automático.
        </p>
        {error && <p className="text-sm text-peligro">{error}</p>}
        <div className="flex gap-2">
          <Boton type="button" variante="secundario" className="flex-1" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" variante="primario" className="flex-1" cargando={cargando}>Guardar</Boton>
        </div>
      </form>
    </Modal>
  );
}
