"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AgendaPublicaProps {
  vendedor: { id: string; nombre: string };
  citasOcupadas: string[];
}

const HORAS = ["10:00", "10:45", "11:30", "12:15", "13:00", "13:45", "14:30", "15:15", "16:00", "16:45", "17:15"];

export function AgendaPublica({ vendedor, citasOcupadas }: AgendaPublicaProps) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", telefono: "", correo: "", notas: "" });
  const [paso, setPaso] = useState<"fecha" | "hora" | "datos" | "confirmado">("fecha");
  const [cargando, setCargando] = useState(false);

  const diasMes = new Date(anio, mes + 1, 0).getDate();
  const diaSemanaInicio = new Date(anio, mes, 1).getDay();

  function esDiaOcupado(dia: number) {
    return citasOcupadas.filter((c) => {
      const f = new Date(c);
      return f.getDate() === dia && f.getMonth() === mes && f.getFullYear() === anio;
    }).length >= HORAS.length;
  }

  function esDiaPasado(dia: number) {
    const f = new Date(anio, mes, dia);
    return f < new Date(hoy.setHours(0, 0, 0, 0));
  }

  function esDomingo(dia: number) {
    return new Date(anio, mes, dia).getDay() === 0;
  }

  function horasDisponibles(dia: number) {
    const ocupadas = citasOcupadas
      .filter((c) => {
        const f = new Date(c);
        return f.getDate() === dia && f.getMonth() === mes && f.getFullYear() === anio;
      })
      .map((c) => {
        const f = new Date(c);
        return `${String(f.getHours()).padStart(2, "0")}:${String(f.getMinutes()).padStart(2, "0")}`;
      });
    return HORAS.filter((h) => !ocupadas.includes(h));
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.telefono || !diaSeleccionado || !horaSeleccionada) {
      toast.error("Completa todos los campos");
      return;
    }
    setCargando(true);
    try {
      const [hh, mm] = horaSeleccionada.split(":").map(Number);
      const fecha = new Date(anio, mes, diaSeleccionado, hh, mm);
      const res = await fetch(`/api/agenda/${vendedor.id}/agendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fecha: fecha.toISOString(), vendedorId: vendedor.id }),
      });
      const json = await res.json();
      if (json.ok) {
        setPaso("confirmado");
      } else {
        toast.error(json.error ?? "No se pudo agendar");
      }
    } finally {
      setCargando(false);
    }
  }

  const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  if (paso === "confirmado") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cita confirmada!</h2>
          <p className="text-gray-600 mb-2">
            Tu cita con <strong>{vendedor.nombre}</strong> está agendada para el{" "}
            <strong>{diaSeleccionado} de {MESES[mes]} {anio}</strong> a las <strong>{horaSeleccionada}</strong>.
          </p>
          <p className="text-sm text-gray-400">Te contactaremos por WhatsApp para confirmar los detalles.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 flex flex-col items-center justify-start p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <p className="text-indigo-300 text-sm mb-2">LEF PATRIMONIAL</p>
          <h1 className="text-3xl font-bold text-white mb-1">Agenda tu cita</h1>
          <p className="text-indigo-200">con <span className="font-semibold">{vendedor.nombre}</span> · 45 minutos · Gratuita</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl space-y-6">
          {(paso === "fecha" || paso === "hora") && (
            <>
              <div className="flex items-center justify-between">
                <button onClick={() => { if (mes === 0) { setMes(11); setAnio((a) => a - 1); } else setMes((m) => m - 1); }}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ChevronLeft className="h-5 w-5" /></button>
                <h2 className="font-semibold text-gray-900">{MESES[mes]} {anio}</h2>
                <button onClick={() => { if (mes === 11) { setMes(0); setAnio((a) => a + 1); } else setMes((m) => m + 1); }}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><ChevronRight className="h-5 w-5" /></button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {DIAS.map((d) => <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>)}
                {Array.from({ length: diaSemanaInicio }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: diasMes }).map((_, i) => {
                  const dia = i + 1;
                  const deshabilitado = esDiaPasado(dia) || esDiaOcupado(dia) || esDomingo(dia);
                  const seleccionado = diaSeleccionado === dia;
                  return (
                    <button key={dia} disabled={deshabilitado}
                      onClick={() => { setDiaSeleccionado(dia); setHoraSeleccionada(null); setPaso("hora"); }}
                      className={`aspect-square rounded-xl text-sm font-medium transition-colors
                        ${deshabilitado ? "text-gray-300 cursor-not-allowed" : seleccionado ? "bg-indigo-600 text-white" : "hover:bg-indigo-50 text-gray-700"}`}>
                      {dia}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {paso === "hora" && diaSeleccionado && (
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Elige un horario para el {diaSeleccionado} de {MESES[mes]}</h3>
              <div className="grid grid-cols-3 gap-2">
                {horasDisponibles(diaSeleccionado).map((h) => (
                  <button key={h}
                    onClick={() => { setHoraSeleccionada(h); setPaso("datos"); }}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-colors
                      ${horaSeleccionada === h ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 hover:border-indigo-400 text-gray-700"}`}>
                    {h}
                  </button>
                ))}
              </div>
              <button onClick={() => setPaso("fecha")} className="text-sm text-indigo-600 mt-4 hover:underline">← Cambiar fecha</button>
            </div>
          )}

          {paso === "datos" && (
            <form onSubmit={confirmar} className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {diaSeleccionado} de {MESES[mes]} · {horaSeleccionada}
                </h3>
                <button type="button" onClick={() => setPaso("hora")} className="text-sm text-indigo-600 hover:underline">← Cambiar horario</button>
              </div>
              {[
                { label: "Tu nombre *", key: "nombre", placeholder: "Juan García" },
                { label: "WhatsApp *", key: "telefono", placeholder: "+52 222 123 4567" },
                { label: "Correo", key: "correo", placeholder: "juan@correo.com" },
                { label: "¿En qué podemos ayudarte?", key: "notas", placeholder: "Seguro de vida, ahorro..." },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input value={form[key as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder={placeholder} />
                </div>
              ))}
              <button type="submit" disabled={cargando}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3.5 transition-colors text-sm">
                {cargando ? "Confirmando..." : "Confirmar cita →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
