"use client";
import { useEffect, useState } from "react";
import { Plus, X, Trash2, Tags, PackagePlus, Wallet, Receipt } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/badge";
import { formatearMoneda } from "@/lib/formato";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { BuscadorProductos } from "./buscador-productos";
import { ModalAperturaCaja } from "./modal-apertura-caja";
import { ModalSalidaCaja } from "./modal-salida-caja";
import { ModalProductoComun } from "./modal-producto-comun";
import { ModalCobro } from "./modal-cobro";
import { imprimirTicketAutomatico } from "@/lib/pos/imprimir-ticket";
import type { PosProductoT, PosDepartamentoT, ItemTicket, Ticket } from "@/lib/pos/tipos";
import type { FormaPago } from "@/lib/pos/constantes";

interface ConfigTicket {
  nombreNegocio: string;
  direccion: string | null;
  telefono: string | null;
  mensajeTicket: string;
  logoUrl: string | null;
  simboloMoneda: string;
  impresora: string | null;
}

const STORAGE_KEY = "pos_tickets_v1";

function ticketNuevo(numero: number): Ticket {
  return { id: crypto.randomUUID(), nombre: `Cuenta ${numero}`, items: [], clienteId: null, clienteNombre: null };
}

export function PantallaVentas() {
  const [turno, setTurno] = useState<{ id: string; fondoInicial: number } | null | undefined>(undefined);
  const [departamentos, setDepartamentos] = useState<PosDepartamentoT[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketActivoId, setTicketActivoId] = useState<string>("");
  const [modalProductoComun, setModalProductoComun] = useState(false);
  const [modalSalida, setModalSalida] = useState(false);
  const [modalCobro, setModalCobro] = useState(false);
  const [procesandoCobro, setProcesandoCobro] = useState(false);
  const [versionCatalogo, setVersionCatalogo] = useState(0);
  const [config, setConfig] = useState<ConfigTicket | null>(null);
  const [sesionNombre, setSesionNombre] = useState("");

  useEffect(() => {
    cargarTurno();
    fetch("/api/pos/departamentos")
      .then((r) => r.json())
      .then((json) => { if (json.ok) setDepartamentos(json.data); });
    fetch("/api/pos/config")
      .then((r) => r.json())
      .then((json) => { if (json.ok) setConfig(json.data); });
    fetch("/api/pos/auth/me")
      .then((r) => r.json())
      .then((json) => { if (json.ok) setSesionNombre(json.data.nombre); });

    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const data = JSON.parse(guardado) as Ticket[];
        if (Array.isArray(data) && data.length > 0) {
          setTickets(data);
          setTicketActivoId(data[0].id);
          return;
        }
      }
    } catch {}
    const inicial = ticketNuevo(1);
    setTickets([inicial]);
    setTicketActivoId(inicial.id);
  }, []);

  useEffect(() => {
    if (tickets.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  }, [tickets]);

  async function cargarTurno() {
    const res = await fetch("/api/pos/turno/actual");
    const json = await res.json();
    setTurno(json.ok ? json.data : null);
  }

  const ticketActivo = tickets.find((t) => t.id === ticketActivoId);

  function actualizarTicket(id: string, actualizar: (t: Ticket) => Ticket) {
    setTickets((prev) => prev.map((t) => (t.id === id ? actualizar(t) : t)));
  }

  function agregarCuenta() {
    const nuevo = ticketNuevo(tickets.length + 1);
    setTickets((prev) => [...prev, nuevo]);
    setTicketActivoId(nuevo.id);
  }

  function cerrarCuenta(id: string) {
    if (tickets.length <= 1) return;
    const ticket = tickets.find((t) => t.id === id);
    if (ticket && ticket.items.length > 0 && !confirm(`"${ticket.nombre}" tiene artículos sin cobrar. ¿Cerrarla de todas formas?`)) return;
    quitarCuentaSinConfirmar(id);
  }

  // Cierra una cuenta sin preguntar: se usa justo después de un cobro exitoso,
  // cuando el ticket todavía tiene los artículos ya pagados en su estado (por
  // el closure de este render) y el diálogo de "tiene artículos sin cobrar"
  // sería falso — la venta ya se registró en el servidor.
  function quitarCuentaSinConfirmar(id: string) {
    if (tickets.length <= 1) return;
    setTickets((prev) => prev.filter((t) => t.id !== id));
    if (ticketActivoId === id) {
      const restantes = tickets.filter((t) => t.id !== id);
      setTicketActivoId(restantes[0]?.id ?? "");
    }
  }

  function agregarProducto(producto: PosProductoT) {
    if (!ticketActivo) return;
    actualizarTicket(ticketActivo.id, (t) => {
      const existente = t.items.find((i) => i.productoId === producto.id && !i.esMayoreo);
      if (existente) {
        return {
          ...t,
          items: t.items.map((i) => (i === existente ? { ...i, cantidad: i.cantidad + 1 } : i)),
        };
      }
      const item: ItemTicket = {
        claveLocal: crypto.randomUUID(),
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precioVenta,
        precioNormal: producto.precioVenta,
        precioMayoreo: producto.precioMayoreo,
        esMayoreo: false,
        existenciaDisponible: producto.existencia,
      };
      return { ...t, items: [...t.items, item] };
    });
  }

  function agregarProductoComun(descripcion: string, monto: number) {
    if (!ticketActivo) return;
    const item: ItemTicket = {
      claveLocal: crypto.randomUUID(),
      productoId: null,
      nombre: descripcion,
      cantidad: 1,
      precioUnitario: monto,
      precioNormal: monto,
      precioMayoreo: null,
      esMayoreo: false,
      existenciaDisponible: null,
    };
    actualizarTicket(ticketActivo.id, (t) => ({ ...t, items: [...t.items, item] }));
    setModalProductoComun(false);
  }

  function cambiarCantidad(clave: string, cantidad: number) {
    if (!ticketActivo || cantidad <= 0) return;
    actualizarTicket(ticketActivo.id, (t) => ({
      ...t,
      items: t.items.map((i) => (i.claveLocal === clave ? { ...i, cantidad } : i)),
    }));
  }

  function alternarMayoreo(clave: string) {
    if (!ticketActivo) return;
    actualizarTicket(ticketActivo.id, (t) => ({
      ...t,
      items: t.items.map((i) => {
        if (i.claveLocal !== clave || i.precioMayoreo === null) return i;
        const esMayoreo = !i.esMayoreo;
        return { ...i, esMayoreo, precioUnitario: esMayoreo ? i.precioMayoreo! : i.precioNormal };
      }),
    }));
  }

  function quitarItem(clave: string) {
    if (!ticketActivo) return;
    actualizarTicket(ticketActivo.id, (t) => ({ ...t, items: t.items.filter((i) => i.claveLocal !== clave) }));
  }

  const total = ticketActivo?.items.reduce((a, i) => a + i.cantidad * i.precioUnitario, 0) ?? 0;

  async function confirmarCobro(pagos: { forma: FormaPago; monto: number }[], clienteId: string | null) {
    if (!ticketActivo || !turno) return;
    setProcesandoCobro(true);
    try {
      const res = await fetch("/api/pos/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnoId: turno.id,
          clienteId,
          notas: null,
          items: ticketActivo.items.map((i) => ({
            productoId: i.productoId,
            descripcion: i.productoId ? undefined : i.nombre,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
            esMayoreo: i.esMayoreo,
          })),
          pagos,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "Error al cobrar");
        return;
      }
      toast.success(`Venta #${json.data.folio} registrada`);
      setModalCobro(false);
      setVersionCatalogo((v) => v + 1);
      if (config) {
        imprimirTicketAutomatico(
          {
            folio: json.data.folio,
            fecha: json.data.fecha,
            cajero: sesionNombre,
            cliente: json.data.cliente?.nombre ?? null,
            items: ticketActivo.items.map((i) => ({ descripcion: i.nombre, cantidad: i.cantidad, precioUnitario: i.precioUnitario })),
            pagos,
            total,
            config,
          },
          config.impresora
        ).then((via) => {
          if (via === "navegador" && config.impresora) {
            toast("No se pudo conectar con QZ Tray, se abrió el diálogo de impresión.", { icon: "⚠️" });
          }
        });
      }
      if (tickets.length === 1) {
        actualizarTicket(ticketActivo.id, (t) => ({ ...t, items: [], clienteId: null, clienteNombre: null }));
      } else {
        quitarCuentaSinConfirmar(ticketActivo.id);
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setProcesandoCobro(false);
    }
  }

  if (turno === undefined) {
    return <div className="p-8 text-center text-texto-suave">Cargando…</div>;
  }

  if (turno === null) {
    return <ModalAperturaCaja onAbierta={cargarTurno} />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-dvh">
      <div className="flex-1 lg:border-r border-borde min-h-[40vh]">
        <BuscadorProductos
          departamentos={departamentos}
          version={versionCatalogo}
          onSeleccionar={agregarProducto}
          onCodigoNoEncontrado={() => {
            toast("Código no encontrado. Usa 'Producto común' para venderlo directamente.", { icon: "ℹ️" });
            setModalProductoComun(true);
          }}
        />
      </div>

      <div className="w-full lg:w-[420px] flex flex-col bg-surface">
        <div className="flex items-center gap-1 border-b border-borde px-3 pt-3 overflow-x-auto">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => setTicketActivoId(t.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                t.id === ticketActivoId ? "border-marca text-marca bg-marca-suave" : "border-transparent text-texto-suave hover:text-texto"
              )}
            >
              {t.nombre}
              {t.items.length > 0 && <span className="text-xs opacity-70">({t.items.length})</span>}
              {tickets.length > 1 && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => { e.stopPropagation(); cerrarCuenta(t.id); }}
                  className="hover:text-peligro"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          ))}
          <button onClick={agregarCuenta} className="p-2 text-texto-suave hover:text-marca flex-shrink-0" aria-label="Nueva cuenta">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-b border-borde">
          <Badge variante="exito">Caja abierta · fondo {formatearMoneda(turno.fondoInicial)}</Badge>
          <button
            onClick={() => setModalSalida(true)}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-texto-suave hover:text-peligro"
          >
            <Wallet className="h-3.5 w-3.5" /> Salida de dinero
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!ticketActivo || ticketActivo.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-texto-muy-suave gap-2 py-10">
              <Receipt className="h-8 w-8" />
              <p className="text-sm">Sin artículos todavía</p>
            </div>
          ) : (
            ticketActivo.items.map((item) => (
              <div key={item.claveLocal} className="rounded-xl border border-borde p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-texto flex-1">{item.nombre}</span>
                  <button onClick={() => quitarItem(item.claveLocal)} className="text-texto-suave hover:text-peligro flex-shrink-0" aria-label="Quitar artículo">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => cambiarCantidad(item.claveLocal, item.cantidad - 1)}
                      className="h-7 w-7 rounded-lg border border-borde text-texto-suave hover:bg-surface-hover"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => cambiarCantidad(item.claveLocal, Number(e.target.value))}
                      className="w-14 text-center rounded-lg border border-borde py-1 text-sm"
                    />
                    <button
                      onClick={() => cambiarCantidad(item.claveLocal, item.cantidad + 1)}
                      className="h-7 w-7 rounded-lg border border-borde text-texto-suave hover:bg-surface-hover"
                    >
                      +
                    </button>
                  </div>
                  {item.precioMayoreo !== null && (
                    <button
                      onClick={() => alternarMayoreo(item.claveLocal)}
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border",
                        item.esMayoreo ? "bg-marca text-white border-marca" : "border-borde text-texto-suave hover:bg-surface-hover"
                      )}
                    >
                      <Tags className="h-3 w-3" /> Mayoreo
                    </button>
                  )}
                  <span className="text-sm font-semibold text-texto ml-auto">{formatearMoneda(item.cantidad * item.precioUnitario)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-borde p-4 space-y-3">
          <Boton variante="secundario" className="w-full" icono={<PackagePlus className="h-4 w-4" />} onClick={() => setModalProductoComun(true)}>
            Producto no registrado
          </Boton>
          <div className="flex items-center justify-between text-lg font-bold text-texto">
            <span>Total</span>
            <span>{formatearMoneda(total)}</span>
          </div>
          <Boton
            variante="exito"
            tamano="lg"
            className="w-full"
            disabled={!ticketActivo || ticketActivo.items.length === 0}
            onClick={() => setModalCobro(true)}
          >
            Cobrar
          </Boton>
        </div>
      </div>

      {modalProductoComun && (
        <ModalProductoComun onCerrar={() => setModalProductoComun(false)} onAgregar={agregarProductoComun} />
      )}
      {modalSalida && (
        <ModalSalidaCaja turnoId={turno.id} onCerrar={() => setModalSalida(false)} onRegistrada={() => setModalSalida(false)} />
      )}
      {modalCobro && (
        <ModalCobro total={total} onCerrar={() => setModalCobro(false)} onConfirmar={confirmarCobro} procesando={procesandoCobro} />
      )}
    </div>
  );
}
