"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { LinkCliente } from "@/components/layout/link-cliente";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Campo, Select } from "@/components/ui/campo";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { SesionUsuario } from "@/lib/auth";

interface Cita {
  id: string;
  fecha: Date | string;
  estado: string;
  notas: string | null;
  cliente: { id: string; nombre: string };
}

export function AgendaVista({ citas, sesion }: { citas: Cita[]; sesion: SesionUsuario }) {
  const router = useRouter();
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [modal, setModal] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [form, setForm] = useState({ clienteId: "", fecha: "", hora: "10:00", notas: "" });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  const inicio = new Date(anio, mes, 1);
  const diasMes = new Date(anio, mes + 1, 0).getDate();
  const diaSemanaInicio = inicio.getDay();

  const citasDelMes = citas.filter((c) => {
    const f = new Date(c.fecha);
    return f.getMonth() === mes && f.getFullYear() === anio;
  });

  function citasDelDia(dia: number) {
    return citasDelMes.filter((c) => new Date(c.fecha).getDate() === dia);
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clienteId || !form.fecha) { toast.error("Completa los campos obligatorios"); return; }
    setCargando(true);
    try {
      const fechaHora = new Date(`${form.fecha}T${form.hora}:00`);
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: form.clienteId, fecha: fechaHora.toISOString(), notas: form.notas }),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error ?? "Error"); return; }
      toast.success("Cita agendada");
      setModal(false);
      router.refresh();
    } finally {
      setCargando(false);
    }
  }

  const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  function prev() { if (mes === 0) { setMes(11); setAnio((a) => a - 1); } else setMes((m) => m - 1); }
  function next() { if (mes === 11) { setMes(0); setAnio((a) => a + 1); } else setMes((m) => m + 1); }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-2 rounded-xl border border-borde hover:bg-surface-hover transition-colors"><ChevronLeft className="h-4 w-4" /></button>
          <h2 className="font-semibold text-texto w-40 text-center">{MESES[mes]} {anio}</h2>
          <button onClick={next} className="p-2 rounded-xl border border-borde hover:bg-surface-hover transition-colors"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <Boton icono={<Plus className="h-4 w-4" />} tamano="sm" onClick={() => setModal(true)}>Nueva cita</Boton>
      </div>

      <Tarjeta className="overflow-hidden p-0">
        <div className="grid grid-cols-7">
          {DIAS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-texto-suave border-b border-borde">{d}</div>
          ))}
          {Array.from({ length: diaSemanaInicio }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-borde last:border-r-0 bg-fondo/50" />
          ))}
          {Array.from({ length: diasMes }).map((_, i) => {
            const dia = i + 1;
            const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();
            const citas = citasDelDia(dia);
            return (
              <div key={dia} className={`min-h-[80px] p-1 border-b border-r border-borde last:border-r-0 ${esHoy ? "bg-marca-suave" : ""}`}>
                <span className={`text-xs font-medium ${esHoy ? "text-marca" : "text-texto-suave"}`}>{dia}</span>
                <div className="space-y-0.5 mt-0.5">
                  {citas.slice(0, 2).map((c) => (
                    <div key={c.id} className="text-xs bg-marca text-white rounded px-1 truncate">
                      {new Date(c.fecha).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} {c.cliente.nombre}
                    </div>
                  ))}
                  {citas.length > 2 && <div className="text-xs text-texto-suave">+{citas.length - 2} más</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Tarjeta>

      {citasDelMes.length === 0 && (
        <EmptyState titulo="Sin citas este mes" descripcion="Agenda la primera cita." accion={{ etiqueta: "+ Nueva cita", onClick: () => setModal(true) }} />
      )}

      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo="Agendar cita">
        <form onSubmit={crear} className="space-y-4">
          <Campo label="ID del cliente *" value={form.clienteId} onChange={(e) => set("clienteId", e.target.value)} placeholder="ID del cliente" />
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Fecha *" type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} />
            <Campo label="Hora" type="time" value={form.hora} onChange={(e) => set("hora", e.target.value)} />
          </div>
          <Campo label="Notas" value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Motivo de la cita..." />
          <div className="flex gap-3 pt-2">
            <Boton type="submit" cargando={cargando}>Agendar</Boton>
            <Boton type="button" variante="secundario" onClick={() => setModal(false)}>Cancelar</Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
