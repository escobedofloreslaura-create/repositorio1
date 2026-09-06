"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Campo } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import toast from "react-hot-toast";

export function ModalAbono({ clienteId, onCerrar, onRegistrado }: { clienteId: string; onCerrar: () => void; onRegistrado: () => void }) {
  const [monto, setMonto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const resTurno = await fetch("/api/pos/turno/actual");
      const jsonTurno = await resTurno.json();
      if (!jsonTurno.ok || !jsonTurno.data) {
        setError("Necesitas tener una caja abierta para registrar el cobro");
        return;
      }
      const res = await fetch(`/api/pos/clientes/${clienteId}/abono`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto: Number(monto), turnoId: jsonTurno.data.id }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Error al registrar el abono");
        return;
      }
      toast.success("Abono registrado");
      onRegistrado();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Cobrar a cliente">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Campo label="Monto recibido" type="number" min={0.01} step="0.01" required value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus />
        {error && <p className="text-sm text-peligro">{error}</p>}
        <div className="flex gap-2">
          <Boton type="button" variante="secundario" className="flex-1" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" variante="exito" className="flex-1" cargando={cargando}>Registrar cobro</Boton>
        </div>
      </form>
    </Modal>
  );
}
