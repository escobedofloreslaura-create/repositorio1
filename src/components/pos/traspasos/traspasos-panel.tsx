"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Search } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { Campo, Select } from "@/components/ui/campo";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonLista } from "@/components/ui/skeleton";
import { formatearFecha } from "@/lib/formato";
import toast from "react-hot-toast";
import type { PosProductoT, PosSucursalT } from "@/lib/pos/tipos";

interface TraspasoHistorial {
  id: string;
  cantidad: number;
  motivo: string | null;
  creadoEn: string;
  producto: { nombre: string };
  sucursalOrigen: { nombre: string };
  sucursalDestino: { nombre: string };
  usuario: { nombre: string };
}

export function TraspasosPanel() {
  const [productos, setProductos] = useState<PosProductoT[]>([]);
  const [sucursales, setSucursales] = useState<PosSucursalT[]>([]);
  const [historial, setHistorial] = useState<TraspasoHistorial[]>([]);
  const [cargando, setCargando] = useState(true);

  const [q, setQ] = useState("");
  const [productoId, setProductoId] = useState("");
  const [sucursalOrigenId, setSucursalOrigenId] = useState("");
  const [sucursalDestinoId, setSucursalDestinoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    setCargando(true);
    const [resProd, resSuc, resHist] = await Promise.all([
      fetch("/api/pos/productos?todasSucursales=1"),
      fetch("/api/pos/sucursales"),
      fetch("/api/pos/traspasos"),
    ]);
    const [jsonProd, jsonSuc, jsonHist] = await Promise.all([resProd.json(), resSuc.json(), resHist.json()]);
    if (jsonProd.ok) setProductos(jsonProd.data);
    if (jsonSuc.ok) {
      setSucursales(jsonSuc.data);
      if (jsonSuc.data.length >= 2 && !sucursalOrigenId && !sucursalDestinoId) {
        setSucursalOrigenId(jsonSuc.data[0].id);
        setSucursalDestinoId(jsonSuc.data[1].id);
      }
    }
    if (jsonHist.ok) setHistorial(jsonHist.data);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productosFiltrados = useMemo(() => {
    if (!q.trim()) return productos;
    const t = q.trim().toLowerCase();
    return productos.filter((p) => p.nombre.toLowerCase().includes(t) || p.codigoBarras?.includes(t));
  }, [productos, q]);

  const productoElegido = productos.find((p) => p.id === productoId);
  const existenciaOrigen = productoElegido?.existenciasPorSucursal?.find((e) => e.sucursalId === sucursalOrigenId)?.existencia ?? 0;
  const existenciaDestino = productoElegido?.existenciasPorSucursal?.find((e) => e.sucursalId === sucursalDestinoId)?.existencia ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!productoId || !sucursalOrigenId || !sucursalDestinoId) {
      setError("Selecciona producto, sucursal de origen y sucursal de destino");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/pos/traspasos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId, sucursalOrigenId, sucursalDestinoId, cantidad: Number(cantidad), motivo: motivo || null }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Error al registrar el traspaso");
        return;
      }
      toast.success("Traspaso registrado");
      setCantidad("");
      setMotivo("");
      cargar();
    } catch {
      setError("Error de conexión");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-texto mb-1">Traspasos entre sucursales</h1>
        <p className="text-sm text-texto-suave">Mueve existencia de un producto de una sucursal a otra. Se registra en el kardex de ambas.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-borde bg-surface p-4 md:p-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-texto-suave" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar producto por nombre o código de barras"
            className="w-full rounded-xl border border-borde bg-surface pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca/30"
          />
        </div>

        <Select
          label="Producto"
          required
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
          opciones={[{ valor: "", etiqueta: "Selecciona un producto" }, ...productosFiltrados.map((p) => ({ valor: p.id, etiqueta: p.nombre }))]}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Select
              label="Sucursal de origen"
              required
              value={sucursalOrigenId}
              onChange={(e) => setSucursalOrigenId(e.target.value)}
              opciones={sucursales.map((s) => ({ valor: s.id, etiqueta: s.nombre }))}
            />
            {productoElegido && <p className="mt-1 text-xs text-texto-suave">Existencia actual: <strong>{existenciaOrigen}</strong></p>}
          </div>
          <div>
            <Select
              label="Sucursal de destino"
              required
              value={sucursalDestinoId}
              onChange={(e) => setSucursalDestinoId(e.target.value)}
              opciones={sucursales.map((s) => ({ valor: s.id, etiqueta: s.nombre }))}
            />
            {productoElegido && <p className="mt-1 text-xs text-texto-suave">Existencia actual: <strong>{existenciaDestino}</strong></p>}
          </div>
        </div>

        {sucursalOrigenId && sucursalDestinoId && sucursalOrigenId === sucursalDestinoId && (
          <p className="text-sm text-peligro">El origen y el destino no pueden ser la misma sucursal.</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Cantidad" type="number" min={0.01} step="0.01" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          <Campo label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Opcional" />
        </div>

        {error && <p className="text-sm text-peligro">{error}</p>}

        <Boton type="submit" icono={<ArrowLeftRight className="h-4 w-4" />} cargando={enviando}>
          Registrar traspaso
        </Boton>
      </form>

      <div>
        <h2 className="text-sm font-semibold text-texto-suave mb-3">Historial de traspasos</h2>
        {cargando ? (
          <SkeletonLista filas={4} />
        ) : historial.length === 0 ? (
          <EmptyState icono={<ArrowLeftRight className="h-8 w-8" />} titulo="Sin traspasos registrados" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-borde bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-borde text-left text-texto-suave">
                  <th className="p-3 font-medium">Fecha</th>
                  <th className="p-3 font-medium">Producto</th>
                  <th className="p-3 font-medium">Origen</th>
                  <th className="p-3 font-medium">Destino</th>
                  <th className="p-3 font-medium text-right">Cantidad</th>
                  <th className="p-3 font-medium">Motivo</th>
                  <th className="p-3 font-medium">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((t) => (
                  <tr key={t.id} className="border-b border-borde last:border-0">
                    <td className="p-3 text-texto-suave whitespace-nowrap">{formatearFecha(t.creadoEn)}</td>
                    <td className="p-3 font-medium text-texto">{t.producto.nombre}</td>
                    <td className="p-3 text-texto-suave">{t.sucursalOrigen.nombre}</td>
                    <td className="p-3 text-texto-suave">{t.sucursalDestino.nombre}</td>
                    <td className="p-3 text-right">{t.cantidad}</td>
                    <td className="p-3 text-texto-suave">{t.motivo ?? "—"}</td>
                    <td className="p-3 text-texto-suave">{t.usuario.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
