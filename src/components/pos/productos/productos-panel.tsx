"use client";
import { useEffect, useState } from "react";
import { Plus, Upload, Pencil, ArrowLeftRight, Trash2, Search, PackageX, AlertTriangle } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonLista } from "@/components/ui/skeleton";
import { formatearMoneda } from "@/lib/formato";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { ModalProducto } from "./modal-producto";
import { ModalMovimiento } from "./modal-movimiento";
import { ModalImportar } from "./modal-importar";
import type { PosProductoT, PosDepartamentoT } from "@/lib/pos/tipos";

export function ProductosPanel({
  puedeEditarCatalogo,
  puedeAjustarInventario,
  esAdmin,
}: {
  /** Nombre, precios, alta/baja del producto: solo el Administrador General (catálogo único de la cadena). */
  puedeEditarCatalogo: boolean;
  /** Entradas/salidas/ajustes de existencia en la sucursal activa: cualquier administrador. */
  puedeAjustarInventario: boolean;
  /** El precio de costo es confidencial: solo lo ve un administrador. */
  esAdmin: boolean;
}) {
  const [productos, setProductos] = useState<PosProductoT[]>([]);
  const [departamentos, setDepartamentos] = useState<PosDepartamentoT[]>([]);
  const [cargando, setCargando] = useState(true);
  const [q, setQ] = useState("");
  const [soloBajos, setSoloBajos] = useState(false);
  const [modalEdicion, setModalEdicion] = useState<{ producto: PosProductoT | null } | null>(null);
  const [modalMovimiento, setModalMovimiento] = useState<PosProductoT | null>(null);
  const [modalImportar, setModalImportar] = useState(false);

  async function cargar() {
    setCargando(true);
    const params = new URLSearchParams({ todos: "1" });
    if (q.trim()) params.set("q", q.trim());
    if (soloBajos) params.set("bajaExistencia", "1");
    const [resProd, resDep] = await Promise.all([
      fetch(`/api/pos/productos?${params.toString()}`),
      fetch("/api/pos/departamentos"),
    ]);
    const [jsonProd, jsonDep] = await Promise.all([resProd.json(), resDep.json()]);
    if (jsonProd.ok) setProductos(jsonProd.data);
    if (jsonDep.ok) setDepartamentos(jsonDep.data);
    setCargando(false);
  }

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, soloBajos]);

  async function eliminar(producto: PosProductoT) {
    if (!confirm(`¿Dar de baja "${producto.nombre}"?`)) return;
    const res = await fetch(`/api/pos/productos/${producto.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error ?? "Error al eliminar");
    toast.success("Producto dado de baja");
    cargar();
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h1 className="text-xl font-bold text-texto">Catálogo de productos</h1>
        {puedeEditarCatalogo && (
          <div className="flex gap-2">
            <Boton variante="secundario" icono={<Upload className="h-4 w-4" />} onClick={() => setModalImportar(true)}>
              Importar
            </Boton>
            <Boton icono={<Plus className="h-4 w-4" />} onClick={() => setModalEdicion({ producto: null })}>
              Nuevo producto
            </Boton>
          </div>
        )}
      </div>
      <p className="text-xs text-texto-muy-suave mb-5">
        Nombre, precios y alta de productos son compartidos por toda la cadena. La existencia mostrada es la de tu sucursal activa.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-texto-suave" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o código de barras"
            className="w-full rounded-xl border border-borde bg-surface pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca/30"
          />
        </div>
        <button
          onClick={() => setSoloBajos(!soloBajos)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors",
            soloBajos ? "bg-red-50 text-red-700 border-red-200" : "border-borde text-texto-suave hover:bg-surface-hover"
          )}
        >
          <AlertTriangle className="h-4 w-4" /> Baja existencia
        </button>
      </div>

      {cargando ? (
        <SkeletonLista filas={6} />
      ) : productos.length === 0 ? (
        <EmptyState icono={<PackageX className="h-8 w-8" />} titulo="Sin productos" descripcion="Da de alta tu primer producto o importa tu catálogo." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-borde bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-texto-suave">
                <th className="p-3 font-medium">Producto</th>
                <th className="p-3 font-medium">Departamento</th>
                {esAdmin && <th className="p-3 font-medium text-right">Costo</th>}
                <th className="p-3 font-medium text-right">Venta</th>
                <th className="p-3 font-medium text-right">Mayoreo</th>
                <th className="p-3 font-medium text-right">Existencia</th>
                {(puedeEditarCatalogo || puedeAjustarInventario) && <th className="p-3 font-medium text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className={cn("border-b border-borde last:border-0", !p.activo && "opacity-50")}>
                  <td className="p-3">
                    <div className="font-medium text-texto">{p.nombre}</div>
                    <div className="text-xs text-texto-muy-suave">{p.codigoBarras ?? "sin código"} · {p.unidad === "CAJA" ? "Caja" : "Pieza"}</div>
                  </td>
                  <td className="p-3 text-texto-suave">{p.departamento?.nombre}</td>
                  {esAdmin && <td className="p-3 text-right">{formatearMoneda(p.precioCosto ?? 0)}</td>}
                  <td className="p-3 text-right font-medium">{formatearMoneda(p.precioVenta)}</td>
                  <td className="p-3 text-right text-texto-suave">{p.precioMayoreo ? formatearMoneda(p.precioMayoreo) : "—"}</td>
                  <td className="p-3 text-right">
                    <Badge variante={p.existencia <= p.existenciaMinima ? "peligro" : "exito"}>{p.existencia}</Badge>
                  </td>
                  {(puedeEditarCatalogo || puedeAjustarInventario) && (
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        {puedeAjustarInventario && (
                          <button onClick={() => setModalMovimiento(p)} className="p-1.5 rounded-lg hover:bg-surface-hover text-texto-suave" title="Movimiento de inventario">
                            <ArrowLeftRight className="h-4 w-4" />
                          </button>
                        )}
                        {puedeEditarCatalogo && (
                          <>
                            <button onClick={() => setModalEdicion({ producto: p })} className="p-1.5 rounded-lg hover:bg-surface-hover text-texto-suave" title="Editar">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => eliminar(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-texto-suave hover:text-peligro" title="Dar de baja">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalEdicion && (
        <ModalProducto
          producto={modalEdicion.producto}
          departamentos={departamentos}
          onCerrar={() => setModalEdicion(null)}
          onGuardado={() => { setModalEdicion(null); cargar(); }}
          onModificarInventario={
            puedeAjustarInventario && modalEdicion.producto
              ? () => { setModalMovimiento(modalEdicion.producto); setModalEdicion(null); }
              : undefined
          }
        />
      )}
      {modalMovimiento && (
        <ModalMovimiento producto={modalMovimiento} onCerrar={() => setModalMovimiento(null)} onRegistrado={() => { setModalMovimiento(null); cargar(); }} />
      )}
      {modalImportar && (
        <ModalImportar onCerrar={() => setModalImportar(false)} onImportado={cargar} />
      )}
    </div>
  );
}
