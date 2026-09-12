"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Campo, Select } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import { PackageSearch } from "lucide-react";
import toast from "react-hot-toast";
import type { PosProductoT, PosDepartamentoT } from "@/lib/pos/tipos";

export function ModalProducto({
  producto,
  departamentos,
  onCerrar,
  onGuardado,
  onModificarInventario,
}: {
  producto: PosProductoT | null;
  departamentos: PosDepartamentoT[];
  onCerrar: () => void;
  onGuardado: () => void;
  /** Presente solo si el usuario puede ajustar existencia; abre el movimiento de inventario para este producto. */
  onModificarInventario?: () => void;
}) {
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? "",
    codigoBarras: producto?.codigoBarras ?? "",
    departamentoId: producto?.departamentoId ?? departamentos[0]?.id ?? "",
    unidad: producto?.unidad ?? "PIEZA",
    precioCosto: producto?.precioCosto?.toString() ?? "",
    precioVenta: producto?.precioVenta?.toString() ?? "",
    precioMayoreo: producto?.precioMayoreo?.toString() ?? "",
    precioClienteFrecuente: producto?.precioClienteFrecuente?.toString() ?? "",
    existencia: "",
    existenciaMinima: producto?.existenciaMinima?.toString() ?? "5",
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  // Si el modal se abre antes de que termine de cargar la lista de
  // departamentos (p. ej. justo al entrar a la pantalla), "departamentoId"
  // queda vacío y el <select> no tiene ninguna opción con ese valor: el
  // navegador muestra el primer departamento como si estuviera elegido, pero
  // el estado real sigue vacío y al guardar el servidor rechaza "nombre y
  // departamento son requeridos" aunque se vea seleccionado. En cuanto llega
  // la lista, si todavía no hay departamento elegido se completa con el
  // primero para que lo que se ve y lo que se va a guardar sea lo mismo.
  useEffect(() => {
    if (!form.departamentoId && departamentos.length > 0) {
      set("departamentoId", departamentos[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departamentos]);

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
      precioClienteFrecuente: form.precioClienteFrecuente || null,
      ...(producto ? {} : { existencia: form.existencia, existenciaMinima: form.existenciaMinima }),
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

        <Select
          label="Unidad"
          value={form.unidad}
          onChange={(e) => set("unidad", e.target.value as "PIEZA" | "CAJA")}
          opciones={[{ valor: "PIEZA", etiqueta: "Pieza" }, { valor: "CAJA", etiqueta: "Caja" }]}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Campo label="Precio costo" type="number" min={0} step="0.01" required value={form.precioCosto} onChange={(e) => set("precioCosto", e.target.value)} />
          <Campo label="Precio venta" type="number" min={0} step="0.01" required value={form.precioVenta} onChange={(e) => set("precioVenta", e.target.value)} />
          <Campo label="Precio mayoreo" type="number" min={0} step="0.01" value={form.precioMayoreo} onChange={(e) => set("precioMayoreo", e.target.value)} placeholder="Opcional" />
          <Campo
            label="Precio cliente frecuente"
            type="number"
            min={0}
            step="0.01"
            value={form.precioClienteFrecuente}
            onChange={(e) => set("precioClienteFrecuente", e.target.value)}
            placeholder="Opcional"
          />
        </div>

        {!producto && (
          <div className="grid grid-cols-2 gap-3">
            <Campo
              label="Existencia inicial (en tu sucursal activa)"
              type="number"
              min={0}
              value={form.existencia}
              onChange={(e) => set("existencia", e.target.value)}
              placeholder="0"
            />
            <Campo
              label="Existencia mínima (en tu sucursal activa)"
              type="number"
              min={0}
              value={form.existenciaMinima}
              onChange={(e) => set("existenciaMinima", e.target.value)}
            />
          </div>
        )}
        {producto && onModificarInventario && (
          <div className="rounded-xl border border-borde p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-texto">Existencia actual: {producto.existencia}</p>
              <p className="text-xs text-texto-muy-suave">Ajusta la cantidad o la existencia mínima en tu sucursal activa.</p>
            </div>
            <Boton type="button" variante="secundario" icono={<PackageSearch className="h-4 w-4" />} onClick={onModificarInventario}>
              Modificar inventario
            </Boton>
          </div>
        )}
        {producto && !onModificarInventario && (
          <p className="text-xs text-texto-muy-suave">
            Para ajustar existencia o existencia mínima por sucursal usa el botón de movimiento de inventario.
          </p>
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
