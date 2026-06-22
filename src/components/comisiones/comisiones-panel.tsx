"use client";
import { useState, useEffect, useCallback } from "react";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { Campo, Select } from "@/components/ui/campo";
import { Modal } from "@/components/ui/modal";
import toast from "react-hot-toast";
import { Plus, Trash2, Pencil, TrendingUp, DollarSign, Gift } from "lucide-react";
import type { SesionUsuario } from "@/lib/auth";

const ASEGURADORAS = [
  { valor: "SEGUROS_MONTERREY", etiqueta: "Seguros Monterrey" },
  { valor: "ALLIANZ", etiqueta: "Allianz" },
];

const TIPOS = [
  { valor: "COMISION", etiqueta: "Comisión" },
  { valor: "BONO", etiqueta: "Bono" },
];

interface Cliente { id: string; nombre: string; }
interface Comision {
  id: string;
  tipo: string;
  aseguradora: string;
  monto: number;
  fecha: string;
  notas: string | null;
  cliente: { id: string; nombre: string } | null;
}

const VACIO = { tipo: "COMISION", aseguradora: "SEGUROS_MONTERREY", monto: "", fecha: new Date().toISOString().split("T")[0], clienteId: "", notas: "" };

function mesActual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function nombreMes(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export function ComisionesPanel({ sesion }: { sesion: SesionUsuario }) {
  const [mes, setMes] = useState(mesActual());
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [totalComisiones, setTotalComisiones] = useState(0);
  const [totalBonos, setTotalBonos] = useState(0);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<Comision | null>(null);
  const [form, setForm] = useState(VACIO);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/comisiones?mes=${mes}`);
    const json = await res.json();
    if (json.ok) {
      setComisiones(json.data);
      setTotalComisiones(json.totalComisiones);
      setTotalBonos(json.totalBonos);
    }
  }, [mes]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    fetch("/api/clientes?take=200").then(r => r.json()).then(j => { if (j.ok) setClientes(j.data); });
  }, []);

  function abrirNueva() { setEditando(null); setForm(VACIO); setModal(true); }
  function abrirEditar(c: Comision) {
    setEditando(c);
    setForm({ tipo: c.tipo, aseguradora: c.aseguradora, monto: c.monto.toString(), fecha: c.fecha.split("T")[0], clienteId: c.cliente?.id ?? "", notas: c.notas ?? "" });
    setModal(true);
  }

  async function guardar() {
    setCargando(true);
    try {
      const url = editando ? `/api/comisiones/${editando.id}` : "/api/comisiones";
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, monto: Number(form.monto), clienteId: form.clienteId || null }),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error); return; }
      toast.success(editando ? "Actualizado" : "Ingreso registrado");
      setModal(false);
      cargar();
    } finally { setCargando(false); }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    await fetch(`/api/comisiones/${id}`, { method: "DELETE" });
    toast.success("Eliminado");
    cargar();
  }

  const etiquetaAseguradora = (v: string) => ASEGURADORAS.find(a => a.valor === v)?.etiqueta ?? v;

  // Meses para navegar (últimos 12)
  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { valor: val, etiqueta: nombreMes(val) };
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-texto">💰 Mis Ingresos</h1>
          <p className="text-sm text-texto-suave mt-0.5">Control de comisiones y bonos por mes</p>
        </div>
        <Boton variante="primario" icono={<Plus className="h-4 w-4" />} onClick={abrirNueva}>Registrar ingreso</Boton>
      </div>

      {/* Selector de mes */}
      <div className="max-w-xs">
        <Select label="Mes" opciones={meses} value={mes} onChange={e => setMes(e.target.value)} />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Tarjeta>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-marca-suave flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-marca" />
            </div>
            <div>
              <p className="text-xs text-texto-suave">Total del mes</p>
              <p className="text-xl font-bold text-texto">${(totalComisiones + totalBonos).toLocaleString("es-MX")}</p>
            </div>
          </div>
        </Tarjeta>
        <Tarjeta>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-texto-suave">Comisiones</p>
              <p className="text-xl font-bold text-emerald-600">${totalComisiones.toLocaleString("es-MX")}</p>
            </div>
          </div>
        </Tarjeta>
        <Tarjeta>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Gift className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-texto-suave">Bonos</p>
              <p className="text-xl font-bold text-amber-600">${totalBonos.toLocaleString("es-MX")}</p>
            </div>
          </div>
        </Tarjeta>
      </div>

      {/* Lista */}
      <Tarjeta>
        <h2 className="font-semibold text-texto mb-4">Registros de {nombreMes(mes)}</h2>
        {comisiones.length === 0 ? (
          <p className="text-sm text-texto-suave">Sin registros para este mes</p>
        ) : (
          <div className="space-y-2">
            {comisiones.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-borde last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.tipo === "BONO" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {c.tipo === "BONO" ? "Bono" : "Comisión"}
                    </span>
                    <span className="text-sm font-semibold text-texto">${c.monto.toLocaleString("es-MX")}</span>
                    <span className="text-xs text-texto-suave">{etiquetaAseguradora(c.aseguradora)}</span>
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-texto-suave">
                    <span>{new Date(c.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
                    {c.cliente && <span>· {c.cliente.nombre}</span>}
                    {c.notas && <span>· {c.notas}</span>}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => abrirEditar(c)} className="p-1.5 rounded-lg hover:bg-surface-hover text-texto-suave transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => eliminar(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-texto-suave hover:text-peligro transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo={editando ? "Editar ingreso" : "Registrar ingreso"}>
        <div className="space-y-3">
          <Select label="Tipo" opciones={TIPOS} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} />
          <Select label="Aseguradora *" opciones={ASEGURADORAS} value={form.aseguradora} onChange={e => setForm(f => ({ ...f, aseguradora: e.target.value }))} />
          <Campo label="Monto ($) *" type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} placeholder="0.00" />
          <Campo label="Fecha *" type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-texto mb-1">Cliente (opcional)</label>
            <select
              className="w-full rounded-xl border border-borde bg-fondo px-3 py-2 text-sm text-texto focus:outline-none focus:ring-2 focus:ring-marca/30"
              value={form.clienteId}
              onChange={e => setForm(f => ({ ...f, clienteId: e.target.value }))}
            >
              <option value="">— Sin cliente —</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <Campo label="Notas (opcional)" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Ej. Renovación anual..." />
        </div>
        <div className="flex gap-3 mt-5">
          <Boton variante="primario" cargando={cargando} onClick={guardar}>Guardar</Boton>
          <Boton variante="secundario" onClick={() => setModal(false)}>Cancelar</Boton>
        </div>
      </Modal>
    </div>
  );
}
