"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Campo, Select } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import toast from "react-hot-toast";
import type { PosProductoT, PosDepartamentoT } from "@/lib/pos/tipos";

export function ModalProducto({
  producto,
  departamentos,
  onCerrar,
  onGuardado,
}: {
  producto: PosProductoT | null;
  departamentos: PosDepartamentoT[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? "",
    codigoBarras: producto?.codigoBarras ?? "",
    departamentoId: producto?.departamentoId ?? departamentos[0]?.id ?? "",
    unidad: producto?.unidad ?? "PIEZA",
    precioCosto: producto?.precioCosto?.toString() ?? "",
    precioVenta: producto?.precioVenta?.toString() ?? "",
    precioMayoreo: producto?.precioMayoreo?.toString() ?? "",
    existencia: "",
    existenciaMinima: producto?.existenciaMinima?.toString() ?? "5",
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");

    const cuerpo = {
      nombre: form.nombre,
      codigoBarras: form.codigoBarras || null,
      departamentoId: form.departamentoId,
      unidad: form.unidad,
      precioCosto: form.precioCosto,
      precioVenta: form.precioVenta,
      precioMayoreo: form.precioMayoreo || null,
      existenciaMinima: form.existenciaMinima,
      ...(producto ? {} : { existencia: form.existencia }),
    };

    try {
      const res = await fetch(producto ? `/api/pos/productos/${producto.id}` : "/api/pos/productos", {
        method: producto ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Error al guardar");
        return;
      }
      toast.success(producto ? "Producto actualizado" : "Producto creado");
      onGuardado();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={producto ? "Editar producto" : "Nuevo producto"} tamano="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Campo label="Nombre / Descripción" required value={form.nombre} onChange={(e) => set("nombre", e.target.value)} autoFocus />

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Código de barras" value={form.codigoBarras} onChange={(e) => set("codigoBarras", e.target.value)} placeholder="Opcional" />
          <Select
            label="Departamento"
            required
            value={form.departamentoId}
            onChange={(e) => set("departamentoId", e.target.value)}
            opciones={departamentos.map((d) => ({ valor: d.id, etiqueta: d.nombre }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Unidad"
            value={form.unidad}
            onChange={(e) => set("unidad", e.target.value as "PIEZA" | "CAJA")}
            opciones={[{ valor: "PIEZA", etiqueta: "Pieza" }, { valor: "CAJA", etiqueta: "Caja" }]}
          />
          <Campo label="Existencia mínima" type="number" min={0} value={form.existenciaMinima} onChange={(e) => set("existenciaMinima", e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Campo label="Precio costo" type="number" min={0} step="0.01" required value={form.precioCosto} onChange={(e) => set("precioCosto", e.target.value)} />
          <Campo label="Precio venta" type="number" min={0} step="0.01" required value={form.precioVenta} onChange={(e) => set("precioVenta", e.target.value)} />
          <Campo label="Precio mayoreo" type="number" min={0} step="0.01" value={form.precioMayoreo} onChange={(e) => set("precioMayoreo", e.target.value)} placeholder="Opcional" />
        </div>

        {!producto && (
          <Campo label="Existencia inicial" type="number" min={0} value={form.existencia} onChange={(e) => set("existencia", e.target.value)} placeholder="0" />
        )}

        {error && <p className="text-sm text-peligro">{error}</p>}

        <div className="flex gap-2">
          <Boton type="button" variante="secundario" className="flex-1" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" variante="primario" className="flex-1" cargando={cargando}>Guardar</Boton>
        </div>
      </form>
    </Modal>
  );
}
