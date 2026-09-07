"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Campo } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import toast from "react-hot-toast";
import type { PosSucursalT } from "@/lib/pos/tipos";

export function ModalSucursal({
  sucursal,
  onCerrar,
  onGuardado,
}: {
  sucursal: PosSucursalT | null;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [nombre, setNombre] = useState(sucursal?.nombre ?? "");
  const [direccion, setDireccion] = useState(sucursal?.direccion ?? "");
  const [telefono, setTelefono] = useState(sucursal?.telefono ?? "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const res = await fetch(sucursal ? `/api/pos/sucursales/${sucursal.id}` : "/api/pos/sucursales", {
        method: sucursal ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, direccion: direccion || null, telefono: telefono || null }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Error al guardar");
        return;
      }
      toast.success(sucursal ? "Sucursal actualizada" : "Sucursal creada");
      onGuardado();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={sucursal ? "Editar sucursal" : "Nueva sucursal"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Campo label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
        <Campo label="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Opcional" />
        <Campo label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Opcional" />
        {error && <p className="text-sm text-peligro">{error}</p>}
        <div className="flex gap-2">
          <Boton type="button" variante="secundario" className="flex-1" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" variante="primario" className="flex-1" cargando={cargando}>Guardar</Boton>
        </div>
      </form>
    </Modal>
  );
}
