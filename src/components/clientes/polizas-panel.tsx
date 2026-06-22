"use client";
import { useState, useEffect } from "react";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { Campo, Select } from "@/components/ui/campo";
import { Modal } from "@/components/ui/modal";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Bell, ShieldCheck } from "lucide-react";

const PRODUCTOS = [
  { valor: "SEGURO_EDUCATIVO", etiqueta: "Seguro Educativo" },
  { valor: "PLAN_RETIRO", etiqueta: "Plan de Retiro" },
  { valor: "SEGURO_VIDA", etiqueta: "Seguro de Vida" },
  { valor: "GASTOS_MEDICOS", etiqueta: "Gastos Médicos Mayores" },
  { valor: "INVERSION", etiqueta: "Inversión" },
  { valor: "SEGURO_AUTO", etiqueta: "Seguro de Auto" },
  { valor: "PLAN_AHORRO", etiqueta: "Plan de Ahorro" },
  { valor: "VIDA_MUJER", etiqueta: "Vida Mujer" },
];

const ASEGURADORAS = [
  { valor: "SEGUROS_MONTERREY", etiqueta: "Seguros Monterrey" },
  { valor: "ALLIANZ", etiqueta: "Allianz" },
];

const FORMAS_PAGO = [
  { valor: "MENSUAL", etiqueta: "Mensual" },
  { valor: "TRIMESTRAL", etiqueta: "Trimestral" },
  { valor: "SEMESTRAL", etiqueta: "Semestral" },
  { valor: "ANUAL", etiqueta: "Anual" },
];

interface Poliza {
  id: string;
  numeroPoliza: string;
  producto: string;
  aseguradora: string;
  formaPago: string;
  fechaProximoPago: string | null;
  monto: number | null;
  notas: string | null;
  activa: boolean;
}

const VACIO = { numeroPoliza: "", producto: "SEGURO_VIDA", aseguradora: "SEGUROS_MONTERREY", formaPago: "MENSUAL", fechaProximoPago: "", monto: "", notas: "" };

export function PolizasPanel({ clienteId }: { clienteId: string }) {
  const [polizas, setPolizas] = useState<Poliza[]>([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Poliza | null>(null);
  const [form, setForm] = useState(VACIO);
  const [cargando, setCargando] = useState(false);

  useEffect(() => { cargar(); }, [clienteId]);

  async function cargar() {
    const res = await fetch(`/api/polizas?clienteId=${clienteId}`);
    const json = await res.json();
    if (json.ok) setPolizas(json.data);
  }

  function abrirNueva() { setEditando(null); setForm(VACIO); setModal(true); }
  function abrirEditar(p: Poliza) {
    setEditando(p);
    setForm({
      numeroPoliza: p.numeroPoliza,
      producto: p.producto,
      aseguradora: p.aseguradora,
      formaPago: p.formaPago,
      fechaProximoPago: p.fechaProximoPago ? p.fechaProximoPago.split("T")[0] : "",
      monto: p.monto?.toString() ?? "",
      notas: p.notas ?? "",
    });
    setModal(true);
  }

  async function guardar() {
    setCargando(true);
    try {
      const url = editando ? `/api/polizas/${editando.id}` : "/api/polizas";
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, clienteId, monto: form.monto || null, fechaProximoPago: form.fechaProximoPago || null }),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error); return; }
      toast.success(editando ? "Póliza actualizada" : "Póliza agregada");
      setModal(false);
      cargar();
    } finally { setCargando(false); }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta póliza?")) return;
    await fetch(`/api/polizas/${id}`, { method: "DELETE" });
    toast.success("Póliza eliminada");
    cargar();
  }

  const etiquetaProducto = (v: string) => PRODUCTOS.find(p => p.valor === v)?.etiqueta ?? v;
  const etiquetaAseguradora = (v: string) => ASEGURADORAS.find(a => a.valor === v)?.etiqueta ?? v;
  const etiquetaPago = (v: string) => FORMAS_PAGO.find(f => f.valor === v)?.etiqueta ?? v;

  const diasParaPago = (fecha: string | null) => {
    if (!fecha) return null;
    const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <Tarjeta>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-texto flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-marca" /> Pólizas</h2>
        <Boton variante="secundario" tamano="sm" icono={<Plus className="h-4 w-4" />} onClick={abrirNueva}>Agregar póliza</Boton>
      </div>

      {polizas.length === 0 ? (
        <p className="text-sm text-texto-suave">Sin pólizas registradas</p>
      ) : (
        <div className="space-y-3">
          {polizas.map((p) => {
            const dias = diasParaPago(p.fechaProximoPago);
            const alerta = dias !== null && dias <= 30 && dias >= 0;
            const vencida = dias !== null && dias < 0;
            return (
              <div key={p.id} className={`p-3 rounded-xl border ${vencida ? "border-red-300 bg-red-50" : alerta ? "border-amber-300 bg-amber-50" : "border-borde bg-fondo"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-texto">{etiquetaProducto(p.producto)}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-marca-suave text-marca">{etiquetaAseguradora(p.aseguradora)}</span>
                      {!p.activa && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Inactiva</span>}
                    </div>
                    <p className="text-xs text-texto-suave mt-0.5">Póliza: <span className="font-mono">{p.numeroPoliza}</span> · {etiquetaPago(p.formaPago)}</p>
                    {p.monto && <p className="text-xs text-texto-suave">Monto: <span className="font-medium text-texto">${p.monto.toLocaleString("es-MX")}</span></p>}
                    {p.fechaProximoPago && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${vencida ? "text-red-600" : alerta ? "text-amber-600" : "text-texto-suave"}`}>
                        <Bell className="h-3 w-3" />
                        {vencida ? `Pago vencido hace ${Math.abs(dias!)} días` : dias === 0 ? "Pago hoy" : `Próximo pago en ${dias} días`}
                        {" "}({new Date(p.fechaProximoPago).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })})
                      </p>
                    )}
                    {p.notas && <p className="text-xs text-texto-suave mt-1 italic">{p.notas}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => abrirEditar(p)} className="p-1.5 rounded-lg hover:bg-surface-hover text-texto-suave hover:text-texto transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => eliminar(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-texto-suave hover:text-peligro transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo={editando ? "Editar póliza" : "Nueva póliza"}>
        <div className="space-y-3">
          <Campo label="Número de póliza *" value={form.numeroPoliza} onChange={e => setForm(f => ({ ...f, numeroPoliza: e.target.value }))} placeholder="Ej. 1234567890" />
          <Select label="Producto *" opciones={PRODUCTOS} value={form.producto} onChange={e => setForm(f => ({ ...f, producto: e.target.value }))} />
          <Select label="Aseguradora *" opciones={ASEGURADORAS} value={form.aseguradora} onChange={e => setForm(f => ({ ...f, aseguradora: e.target.value }))} />
          <Select label="Forma de pago" opciones={FORMAS_PAGO} value={form.formaPago} onChange={e => setForm(f => ({ ...f, formaPago: e.target.value }))} />
          <Campo label="Fecha próximo pago" type="date" value={form.fechaProximoPago} onChange={e => setForm(f => ({ ...f, fechaProximoPago: e.target.value }))} />
          <Campo label="Monto ($)" type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} placeholder="0.00" />
          <Campo label="Notas (opcional)" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Observaciones..." />
        </div>
        <div className="flex gap-3 mt-5">
          <Boton variante="primario" cargando={cargando} onClick={guardar}>Guardar</Boton>
          <Boton variante="secundario" onClick={() => setModal(false)}>Cancelar</Boton>
        </div>
      </Modal>
    </Tarjeta>
  );
}
