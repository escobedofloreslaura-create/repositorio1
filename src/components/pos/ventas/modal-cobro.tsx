"use client";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { formatearMoneda } from "@/lib/formato";
import { ETIQUETAS_FORMA_PAGO, type FormaPago } from "@/lib/pos/constantes";
import type { PosClienteT } from "@/lib/pos/tipos";
import { Banknote, CreditCard, Landmark, HandCoins, Trash2, Search } from "lucide-react";

interface PagoBorrador {
  claveLocal: string;
  forma: FormaPago;
  monto: number;
  referencia: string;
}

const FORMAS_CON_REFERENCIA: FormaPago[] = ["TARJETA", "TRANSFERENCIA"];

const ICONOS: Record<FormaPago, React.ElementType> = {
  EFECTIVO: Banknote,
  TARJETA: CreditCard,
  TRANSFERENCIA: Landmark,
  CREDITO: HandCoins,
};

export function ModalCobro({
  total,
  clienteInicial,
  onCerrar,
  onConfirmar,
  procesando,
}: {
  total: number;
  /** Cliente ya asignado a la cuenta desde la pantalla de Ventas (para precios); se precarga aquí para no tener que buscarlo de nuevo. */
  clienteInicial?: { id: string; nombre: string } | null;
  onCerrar: () => void;
  onConfirmar: (pagos: { forma: FormaPago; monto: number; referencia?: string }[], clienteId: string | null) => void;
  procesando: boolean;
}) {
  const [pagos, setPagos] = useState<PagoBorrador[]>([]);
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [cliente, setCliente] = useState<PosClienteT | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [resultadosCliente, setResultadosCliente] = useState<PosClienteT[]>([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  useEffect(() => {
    if (!clienteInicial?.id) return;
    fetch(`/api/pos/clientes/${clienteInicial.id}`)
      .then((r) => r.json())
      .then((json) => { if (json.ok) setCliente(json.data.cliente); });
    // Solo se precarga una vez al abrir el modal con el cliente que ya
    // traía la cuenta; si el cajero lo cambia aquí (para crédito), no debe
    // volver a sobreescribirse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPagado = pagos.reduce((a, p) => a + p.monto, 0);
  const restante = Math.max(0, Math.round((total - totalPagado) * 100) / 100);
  const listo = restante <= 0.005 && (!pagos.some((p) => p.forma === "CREDITO") || !!cliente);

  const pagoEfectivo = pagos.find((p) => p.forma === "EFECTIVO");
  const cambio = pagoEfectivo && efectivoRecibido ? Math.max(0, Number(efectivoRecibido) - pagoEfectivo.monto) : 0;

  const creditoDisponible = useMemo(
    () => (cliente ? cliente.limiteCredito - cliente.saldoActual : 0),
    [cliente]
  );
  const montoCredito = pagos.filter((p) => p.forma === "CREDITO").reduce((a, p) => a + p.monto, 0);

  function agregarForma(forma: FormaPago) {
    if (pagos.some((p) => p.forma === forma)) return;
    setPagos((prev) => [...prev, { claveLocal: crypto.randomUUID(), forma, monto: restante, referencia: "" }]);
  }

  function actualizarMonto(clave: string, monto: number) {
    setPagos((prev) => prev.map((p) => (p.claveLocal === clave ? { ...p, monto } : p)));
  }

  function actualizarReferencia(clave: string, referencia: string) {
    setPagos((prev) => prev.map((p) => (p.claveLocal === clave ? { ...p, referencia } : p)));
  }

  function quitarPago(clave: string) {
    setPagos((prev) => prev.filter((p) => p.claveLocal !== clave));
  }

  async function buscarClientes(q: string) {
    setBusquedaCliente(q);
    if (q.trim().length < 2) {
      setResultadosCliente([]);
      return;
    }
    setBuscandoCliente(true);
    try {
      const res = await fetch(`/api/pos/clientes?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.ok) setResultadosCliente(json.data);
    } finally {
      setBuscandoCliente(false);
    }
  }

  function confirmar() {
    if (!listo) return;
    onConfirmar(
      pagos.map((p) => ({ forma: p.forma, monto: p.monto, referencia: p.referencia.trim() || undefined })),
      cliente?.id ?? null
    );
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Cobrar" tamano="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-xl bg-marca-suave px-4 py-3">
          <span className="text-sm font-medium text-marca">Total a pagar</span>
          <span className="text-2xl font-bold text-marca">{formatearMoneda(total)}</span>
        </div>

        {cliente && !pagos.some((p) => p.forma === "CREDITO") && (
          <p className="text-xs text-texto-suave">
            Cliente de la cuenta: <span className="font-medium text-texto">{cliente.nombre}</span>
          </p>
        )}

        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(ETIQUETAS_FORMA_PAGO) as FormaPago[]).map((forma) => {
            const Icono = ICONOS[forma];
            const yaAgregada = pagos.some((p) => p.forma === forma);
            return (
              <button
                key={forma}
                type="button"
                disabled={yaAgregada || restante <= 0}
                onClick={() => agregarForma(forma)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-borde p-3 text-xs font-medium text-texto hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Icono className="h-5 w-5 text-marca" />
                {ETIQUETAS_FORMA_PAGO[forma]}
              </button>
            );
          })}
        </div>

        {pagos.length > 0 && (
          <div className="space-y-3">
            {pagos.map((pago) => {
              const Icono = ICONOS[pago.forma];
              return (
                <div key={pago.claveLocal} className="rounded-xl border border-borde p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icono className="h-4 w-4 text-marca flex-shrink-0" />
                    <span className="text-sm font-medium w-28 flex-shrink-0">{ETIQUETAS_FORMA_PAGO[pago.forma]}</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={pago.monto}
                      onChange={(e) => actualizarMonto(pago.claveLocal, Number(e.target.value))}
                      className="flex-1 rounded-lg border border-borde px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-marca/30"
                    />
                    <button type="button" onClick={() => quitarPago(pago.claveLocal)} className="text-texto-suave hover:text-peligro p-1" aria-label="Quitar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {FORMAS_CON_REFERENCIA.includes(pago.forma) && (
                    <div className="flex gap-2 pl-6">
                      <input
                        value={pago.referencia}
                        onChange={(e) => actualizarReferencia(pago.claveLocal, e.target.value)}
                        placeholder="Folio / autorización de la terminal (opcional)"
                        className="flex-1 rounded-lg border border-borde px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-marca/30"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {pagoEfectivo && (
          <div className="grid grid-cols-2 gap-3">
            <Campo
              label="Efectivo recibido"
              type="number"
              min={0}
              step="0.01"
              value={efectivoRecibido}
              onChange={(e) => setEfectivoRecibido(e.target.value)}
              placeholder="0.00"
            />
            <div className="flex flex-col justify-end">
              <span className="text-xs text-texto-suave mb-1.5">Cambio a entregar</span>
              <div className="h-10 flex items-center px-4 rounded-xl bg-emerald-50 text-emerald-700 font-semibold">
                {formatearMoneda(cambio)}
              </div>
            </div>
          </div>
        )}

        {pagos.some((p) => p.forma === "CREDITO") && (
          <div className="space-y-2 rounded-xl border border-borde p-3">
            <label className="text-sm font-medium text-texto">Cliente a crédito</label>
            {cliente ? (
              <div className="flex items-center justify-between rounded-lg bg-surface-hover px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{cliente.nombre}</div>
                  <div className="text-xs text-texto-suave">
                    Disponible: {formatearMoneda(creditoDisponible)} · Solicitado: {formatearMoneda(montoCredito)}
                  </div>
                </div>
                <button type="button" onClick={() => setCliente(null)} className="text-xs text-marca">Cambiar</button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-texto-suave" />
                  <input
                    value={busquedaCliente}
                    onChange={(e) => buscarClientes(e.target.value)}
                    placeholder="Buscar cliente por nombre o teléfono"
                    className="w-full rounded-xl border border-borde pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca/30"
                  />
                </div>
                {(resultadosCliente.length > 0 || buscandoCliente) && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-borde bg-surface shadow-lg max-h-48 overflow-y-auto">
                    {resultadosCliente.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCliente(c);
                          setResultadosCliente([]);
                          setBusquedaCliente("");
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover"
                      >
                        {c.nombre} {c.telefono ? `· ${c.telefono}` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {cliente && montoCredito > creditoDisponible && (
              <p className="text-xs text-peligro">El cliente no tiene suficiente crédito disponible.</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-texto-suave">Restante por pagar</span>
          <span className={restante > 0 ? "font-semibold text-peligro" : "font-semibold text-exito"}>{formatearMoneda(restante)}</span>
        </div>

        <div className="flex gap-2">
          <Boton type="button" variante="secundario" className="flex-1" onClick={onCerrar}>Cancelar</Boton>
          <Boton
            type="button"
            variante="exito"
            className="flex-1"
            disabled={!listo || (cliente ? montoCredito > creditoDisponible : false)}
            cargando={procesando}
            onClick={confirmar}
          >
            Confirmar cobro
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
