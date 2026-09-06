"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Campo } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { Wallet } from "lucide-react";
import toast from "react-hot-toast";

export function ModalAperturaCaja({ onAbierta }: { onAbierta: () => void }) {
  const [fondoInicial, setFondoInicial] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/pos/turno/abrir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fondoInicial: Number(fondoInicial) || 0 }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Error al abrir la caja");
        return;
      }
      toast.success("Caja abierta");
      onAbierta();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto onCerrar={() => {}} titulo="Apertura de caja">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-marca-suave text-marca p-3">
          <Wallet className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">Registra el fondo inicial de efectivo para poder empezar a vender.</p>
        </div>
        <Campo
          label="Fondo inicial"
          type="number"
          min={0}
          step="0.01"
          value={fondoInicial}
          onChange={(e) => setFondoInicial(e.target.value)}
          placeholder="0.00"
          autoFocus
          required
        />
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Boton type="submit" variante="primario" tamano="lg" cargando={cargando} className="w-full">
          Abrir caja
        </Boton>
      </form>
    </Modal>
  );
}
