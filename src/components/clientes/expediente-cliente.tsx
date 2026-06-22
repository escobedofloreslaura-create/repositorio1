"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, MessageCircle, Trophy, XCircle, Archive, Sparkles, Calendar, DollarSign } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { TemperaturaBadge } from "@/components/ui/temperatura-badge";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Modal } from "@/components/ui/modal";
import { Campo, Select } from "@/components/ui/campo";
import { formatearFechaHumana, telefonoWhatsApp } from "@/lib/formato";
import { OBJECIONES } from "@/lib/constantes";
import { PanelIA } from "@/components/ia/panel-ia";
import { PolizasPanel } from "@/components/clientes/polizas-panel";
import toast from "react-hot-toast";

const PRODUCTOS_INTERES = [
  "Seguro Educativo", "Plan de Retiro", "Seguro de Vida", "Gastos Médicos Mayores",
  "Inversión", "Seguro de Auto", "Plan de Ahorro", "Vida Mujer",
];

interface ClienteCompleto {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  etapa: string;
  estado: string;
  temperatura: string;
  objecionPrincipal: string | null;
  valorEstimado: number | null;
  notas: string | null;
  proximaAccion: string | null;
  proximaAccionFecha: Date | string | null;
  ultimoContactoEn: Date | string | null;
  empresaNombre: string | null;
  empresaPuesto: string | null;
  origen: string | null;
  motivoPerdida: string | null;
  vendedor: { id: string; nombre: string } | null;
  citas: Array<{ id: string; fecha: Date | string; estado: string; notas: string | null }>;
  pagos: Array<{ id: string; monto: number; montoTotal: number | null; metodo: string; estatus: string; fechaPago: Date | string | null }>;
  historial: Array<{ id: string; tipo: string; descripcion: string; fecha: Date | string; usuario: { nombre: string } | null }>;
  archivos: Array<{ id: string; nombre: string; etiqueta: string; creadoEn: Date | string; subidoPor: { nombre: string } | null }>;
  etiquetasCliente: Array<{ etiqueta: { id: string; nombre: string; color: string } }>;
}

const MOTIVOS_PERDIDA = ["Precio", "Se fue con la competencia", "No contestó", "No era buen momento", "No calificaba", "Otro"];

export function ExpedienteCliente({ cliente: c, sesion }: { cliente: ClienteCompleto; sesion: { rol: string; nombre: string } }) {
  const router = useRouter();
  const [modalEstado, setModalEstado] = useState<"ganado" | "perdido" | "archivado" | null>(null);
  const [motivoPerdida, setMotivoPerdida] = useState("Precio");
  const [cargandoEstado, setCargandoEstado] = useState(false);
  const [mostrarIA, setMostrarIA] = useState(false);

  async function cambiarEstado(estado: string, motivo?: string) {
    setCargandoEstado(true);
    try {
      const res = await fetch(`/api/clientes/${c.id}/estado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado, motivoPerdida: motivo }),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error); return; }
      toast.success(estado === "GANADO" ? `¡Cerraste a ${c.nombre}! 🎉` : "Estado actualizado");
      setModalEstado(null);
      router.refresh();
    } finally {
      setCargandoEstado(false);
    }
  }

  const diasSinContacto = c.ultimoContactoEn
    ? Math.floor((Date.now() - new Date(c.ultimoContactoEn).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const waUrl = c.telefono
    ? `https://wa.me/${telefonoWhatsApp(c.telefono)}?text=${encodeURIComponent(`Hola ${c.nombre}, `)}`
    : null;

  const totalPagado = c.pagos.filter((p) => p.estatus === "pagado").reduce((s, p) => s + p.monto, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Volver */}
      <button onClick={() => router.push("/clientes")} className="flex items-center gap-2 text-sm text-texto-suave hover:text-texto transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </button>

      {/* Encabezado */}
      <Tarjeta>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-texto">{c.nombre}</h1>
              <EstadoBadge estado={c.estado} />
              <TemperaturaBadge temperatura={c.temperatura} />
            </div>
            <p className="text-texto-suave mt-1">{c.etapa}</p>
            {c.objecionPrincipal && (
              <p className="text-sm text-amber-600 mt-1">⚠️ Objeción: {c.objecionPrincipal}</p>
            )}
            {diasSinContacto !== null && diasSinContacto > 3 && (
              <p className="text-sm text-red-600 mt-1">🕒 {diasSinContacto} días sin contacto</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {waUrl && (
              <Boton variante="exito" tamano="sm" icono={<MessageCircle className="h-4 w-4" />}
                onClick={() => window.open(waUrl, "_blank")}>WhatsApp</Boton>
            )}
            {c.correo && (
              <Boton variante="secundario" tamano="sm" icono={<Mail className="h-4 w-4" />}
                onClick={() => window.open(`mailto:${c.correo}?subject=Seguimiento LEF PATRIMONIAL`, "_blank")}>Correo</Boton>
            )}
            <Boton variante="fantasma" tamano="sm" icono={<Sparkles className="h-4 w-4" />}
              onClick={() => setMostrarIA(!mostrarIA)}>IA</Boton>
          </div>
        </div>

        {/* Próxima acción */}
        {c.proximaAccion && (
          <div className="mt-4 p-3 rounded-xl bg-marca-suave border border-marca/20">
            <p className="text-sm font-medium text-marca">📋 Próxima acción: {c.proximaAccion}</p>
            {c.proximaAccionFecha && (
              <p className="text-xs text-marca/70 mt-0.5">{new Date(c.proximaAccionFecha).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}</p>
            )}
          </div>
        )}

        {/* Botones de estado */}
        {c.estado === "ACTIVO" && (
          <div className="flex gap-2 mt-4 flex-wrap">
            <Boton variante="exito" tamano="sm" icono={<Trophy className="h-4 w-4" />}
              onClick={() => setModalEstado("ganado")}>Marcar como Ganado 🎉</Boton>
            <Boton variante="secundario" tamano="sm" icono={<XCircle className="h-4 w-4" />}
              onClick={() => setModalEstado("perdido")}>Marcar como Perdido</Boton>
            <Boton variante="secundario" tamano="sm" icono={<Archive className="h-4 w-4" />}
              onClick={() => setModalEstado("archivado")}>Archivar</Boton>
          </div>
        )}
        {(c.estado === "GANADO" || c.estado === "PERDIDO" || c.estado === "ARCHIVADO") && (
          <Boton variante="secundario" tamano="sm" className="mt-4"
            onClick={() => cambiarEstado("ACTIVO")}>Reactivar al embudo</Boton>
        )}
      </Tarjeta>

      {/* Panel IA */}
      {mostrarIA && <PanelIA clienteId={c.id} clienteNombre={c.nombre} />}

      {/* Datos básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Tarjeta>
          <h2 className="font-semibold text-texto mb-3">Información de contacto</h2>
          <div className="space-y-2 text-sm">
            {c.telefono && <div className="flex items-center gap-2 text-texto-suave"><Phone className="h-4 w-4" />{c.telefono}</div>}
            {c.correo && <div className="flex items-center gap-2 text-texto-suave"><Mail className="h-4 w-4" />{c.correo}</div>}
            {c.origen && <div className="text-texto-suave">Origen: <span className="text-texto">{c.origen}</span></div>}
            {c.valorEstimado && (
              <div className="flex items-center gap-2 text-texto-suave">
                <DollarSign className="h-4 w-4" />
                Valor estimado: <span className="text-texto font-semibold">${c.valorEstimado.toLocaleString("es-MX")}</span>
              </div>
            )}
            {c.vendedor && <div className="text-texto-suave">Vendedor: <span className="text-texto">{c.vendedor.nombre}</span></div>}
          </div>
          {c.notas && <p className="mt-3 text-sm text-texto-suave border-t border-borde pt-3">{c.notas}</p>}
        </Tarjeta>

        {c.empresaNombre && (
          <Tarjeta>
            <h2 className="font-semibold text-texto mb-3">Empresa</h2>
            <div className="space-y-1 text-sm">
              <div className="font-medium text-texto">{c.empresaNombre}</div>
              {c.empresaPuesto && <div className="text-texto-suave">{c.empresaPuesto}</div>}
            </div>
          </Tarjeta>
        )}
      </div>

      {/* Pólizas */}
      <PolizasPanel clienteId={c.id} />

      {/* Productos de interés y próximo contacto */}
      <Tarjeta>
        <h2 className="font-semibold text-texto mb-3">Intereses y seguimiento</h2>
        <div className="space-y-3 text-sm">
          {c.productosInteres && (
            <div>
              <span className="text-texto-suave text-xs uppercase tracking-wide">Productos de interés</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {c.productosInteres.split(",").map(p => p.trim()).filter(Boolean).map(p => (
                  <span key={p} className="px-2 py-0.5 rounded-full bg-marca-suave text-marca text-xs">{p}</span>
                ))}
              </div>
            </div>
          )}
          {c.proximaAccion && (
            <div>
              <span className="text-texto-suave text-xs uppercase tracking-wide">Próxima acción</span>
              <p className="text-texto mt-0.5">{c.proximaAccion}</p>
            </div>
          )}
          {c.proximaAccionFecha && (
            <div>
              <span className="text-texto-suave text-xs uppercase tracking-wide">Fecha de próximo contacto</span>
              <p className="text-texto mt-0.5">{new Date(c.proximaAccionFecha).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          )}
        </div>
      </Tarjeta>

      {/* Pagos */}
      <Tarjeta>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-texto">Pagos</h2>
          <span className="text-sm font-medium text-emerald-600">${totalPagado.toLocaleString("es-MX")} cobrado</span>
        </div>
        {c.pagos.length === 0 ? (
          <p className="text-sm text-texto-suave">Sin pagos registrados</p>
        ) : (
          <div className="space-y-2">
            {c.pagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-borde last:border-0 text-sm">
                <div>
                  <span className="font-medium text-texto">${p.monto.toLocaleString("es-MX")}</span>
                  <span className="text-texto-suave ml-2">{p.metodo}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.estatus === "pagado" ? "bg-emerald-50 text-emerald-700" : p.estatus === "vencido" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                  {p.estatus}
                </span>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      {/* Citas */}
      <Tarjeta>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-texto">Citas</h2>
          <Calendar className="h-4 w-4 text-texto-suave" />
        </div>
        {c.citas.length === 0 ? (
          <p className="text-sm text-texto-suave">Sin citas agendadas</p>
        ) : (
          <div className="space-y-2">
            {c.citas.map((cita) => (
              <div key={cita.id} className="py-2 border-b border-borde last:border-0 text-sm">
                <span className="font-medium text-texto">{new Date(cita.fecha).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${cita.estado === "completada" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{cita.estado}</span>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      {/* Historial */}
      <Tarjeta>
        <h2 className="font-semibold text-texto mb-4">Historial</h2>
        {c.historial.length === 0 ? (
          <p className="text-sm text-texto-suave">Sin historial</p>
        ) : (
          <div className="space-y-3">
            {c.historial.map((h) => (
              <div key={h.id} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-marca mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-texto">{h.descripcion}</p>
                  <p className="text-xs text-texto-suave mt-0.5">{formatearFechaHumana(h.fecha)} · {h.usuario?.nombre ?? "Sistema"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      {/* Modales de cambio de estado */}
      <Modal abierto={modalEstado === "ganado"} onCerrar={() => setModalEstado(null)} titulo="¡Marcar como Ganado! 🎉">
        <p className="text-sm text-texto-suave mb-6">
          Esto va a marcar a <strong>{c.nombre}</strong> como Ganado y lo moverá a Clientes completados. ¿Confirmas?
        </p>
        <div className="flex gap-3">
          <Boton variante="exito" cargando={cargandoEstado} onClick={() => cambiarEstado("GANADO")}>
            ¡Sí, cerramos! 🎉
          </Boton>
          <Boton variante="secundario" onClick={() => setModalEstado(null)}>Cancelar</Boton>
        </div>
      </Modal>

      <Modal abierto={modalEstado === "perdido"} onCerrar={() => setModalEstado(null)} titulo="Marcar como Perdido">
        <p className="text-sm text-texto-suave mb-4">¿Por qué no se cerró esta venta?</p>
        <Select
          label="Motivo de pérdida"
          opciones={MOTIVOS_PERDIDA.map((m) => ({ valor: m, etiqueta: m }))}
          value={motivoPerdida}
          onChange={(e) => setMotivoPerdida(e.target.value)}
          className="mb-6"
        />
        <div className="flex gap-3">
          <Boton variante="peligro" cargando={cargandoEstado} onClick={() => cambiarEstado("PERDIDO", motivoPerdida)}>
            Marcar como Perdido
          </Boton>
          <Boton variante="secundario" onClick={() => setModalEstado(null)}>Cancelar</Boton>
        </div>
      </Modal>

      <Modal abierto={modalEstado === "archivado"} onCerrar={() => setModalEstado(null)} titulo="Archivar cliente">
        <p className="text-sm text-texto-suave mb-6">
          ¿Archivar a <strong>{c.nombre}</strong>? Podrás restaurarlo cuando quieras.
        </p>
        <div className="flex gap-3">
          <Boton variante="secundario" cargando={cargandoEstado} onClick={() => cambiarEstado("ARCHIVADO")}>
            Archivar
          </Boton>
          <Boton variante="secundario" onClick={() => setModalEstado(null)}>Cancelar</Boton>
        </div>
      </Modal>
    </div>
  );
}
