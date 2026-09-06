"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Campo, Select } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import toast from "react-hot-toast";

export function ModalSalidaCaja({ turnoId, onCerrar, onRegistrada }: { turnoId: string; onCerrar: () => void; onRegistrada: () => void }) {
  const [tipo, setTipo] = useState<"SALIDA" | "PAGO_PROVEEDOR">("SALIDA");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`/api/pos/turno/${turnoId}/movimiento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, monto: Number(monto), concepto }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Error al registrar la salida");
        return;
      }
      toast.success("Salida de dinero registrada");
      onRegistrada();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Salida de dinero">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Tipo de salida"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as typeof tipo)}
          opciones={[
            { valor: "SALIDA", etiqueta: "Retiro de efectivo" },
            { valor: "PAGO_PROVEEDOR", etiqueta: "Pago a proveedor" },
          ]}
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
          autoFocus
        />
        <Campo
          label="Concepto"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Ej. pago a proveedor de cerveza"
          required
        />
        {error && <p className="text-sm text-peligro">{error}</p>}
        <div className="flex gap-2">
          <Boton type="button" variante="secundario" className="flex-1" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" variante="peligro" cargando={cargando} className="flex-1">Registrar salida</Boton>
        </div>
      </form>
    </Modal>
  );
}
