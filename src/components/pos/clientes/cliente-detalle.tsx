"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, HandCoins } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Badge } from "@/components/ui/badge";
import { SkeletonLista } from "@/components/ui/skeleton";
import { formatearMoneda, formatearFechaHumana } from "@/lib/formato";
import { ModalAbono } from "./modal-abono";
import type { PosClienteT } from "@/lib/pos/tipos";

interface DetalleVenta {
  id: string;
  descripcion: string;
  cantidad: number;
  cantidadDevuelta: number;
  precioUnitario: number;
  producto: { nombre: string } | null;
}

interface VentaCredito {
  id: string;
  folio: number;
  fecha: string;
  total: number;
  estado: string;
  detalles: DetalleVenta[];
  pagos: { forma: string; monto: number }[];
  usuario: { nombre: string };
}

export function ClienteDetalle({ id }: { id: string }) {
  const [cliente, setCliente] = useState<PosClienteT | null>(null);
  const [ventas, setVentas] = useState<VentaCredito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbono, setModalAbono] = useState(false);

  async function cargar() {
    setCargando(true);
    const res = await fetch(`/api/pos/clientes/${id}`);
    const json = await res.json();
    if (json.ok) {
      setCliente(json.data.cliente);
      setVentas(json.data.ventasCredito);
    }
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (cargando || !cliente) return <div className="p-6 max-w-3xl mx-auto"><SkeletonLista filas={4} /></div>;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <Link href="/pos/clientes" className="inline-flex items-center gap-1 text-sm text-texto-suave hover:text-texto mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-texto">{cliente.nombre}</h1>
          <p className="text-sm text-texto-suave">{cliente.telefono ?? "sin teléfono"} · {cliente.direccion ?? "sin dirección"}</p>
        </div>
        <Boton icono={<HandCoins className="h-4 w-4" />} onClick={() => setModalAbono(true)}>Cobrar</Boton>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Tarjeta padding="md">
          <p className="text-xs text-texto-suave">Saldo pendiente</p>
          <p className="text-xl font-bold text-peligro">{formatearMoneda(cliente.saldoActual)}</p>
        </Tarjeta>
        <Tarjeta padding="md">
          <p className="text-xs text-texto-suave">Límite de crédito</p>
          <p className="text-xl font-bold text-texto">{formatearMoneda(cliente.limiteCredito)}</p>
        </Tarjeta>
      </div>

      <h2 className="text-sm font-semibold text-texto-suave uppercase tracking-wide mb-3">Estado de cuenta</h2>
      {ventas.length === 0 ? (
        <p className="text-sm text-texto-suave">Este cliente no tiene compras a crédito.</p>
      ) : (
        <div className="space-y-3">
          {ventas.map((v) => (
            <Tarjeta key={v.id} padding="md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-texto">Venta #{v.folio}</span>
                <div className="flex items-center gap-2">
                  <Badge variante={v.estado === "CANCELADA" ? "peligro" : "neutro"}>{v.estado}</Badge>
                  <span className="text-xs text-texto-suave">{formatearFechaHumana(v.fecha)}</span>
                </div>
              </div>
              <ul className="text-sm text-texto-suave space-y-0.5 mb-2">
                {v.detalles.map((d) => (
                  <li key={d.id}>
                    {d.cantidad}x {d.producto?.nombre ?? d.descripcion} — {formatearMoneda(d.cantidad * d.precioUnitario)}
                    {d.cantidadDevuelta > 0 && <span className="text-peligro"> (devuelto {d.cantidadDevuelta})</span>}
                  </li>
                ))}
              </ul>
              <div className="flex justify-between text-sm font-semibold">
                <span>Vendió: {v.usuario.nombre}</span>
                <span>{formatearMoneda(v.total)}</span>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}

      {modalAbono && (
        <ModalAbono clienteId={id} onCerrar={() => setModalAbono(false)} onRegistrado={() => { setModalAbono(false); cargar(); }} />
      )}
    </div>
  );
}
