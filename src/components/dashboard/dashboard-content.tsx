"use client";
import { useEffect, useState } from "react";
import { Users, CalendarDays, Trophy, Wallet, TrendingUp, TrendingDown, Target } from "lucide-react";
import { Tarjeta } from "@/components/ui/tarjeta";
import { GraficaCrecimiento } from "./grafica-crecimiento";
import { BarraMeta } from "./barra-meta";
import { Pronostico } from "./pronostico";
import { SkeletonTarjeta } from "@/components/ui/skeleton";
import type { SesionUsuario } from "@/lib/auth";

interface DatosPanel {
  nuevosInteresados: number;
  citasAgendadas: number;
  clientesGanados: number;
  ingresosCobrados: number;
  pagosPendientes: number;
  pagosVencidos: number;
  tasaCierre: number;
  valorEmbudo: number;
  pronostico: number;
  metaMensual: number;
  diasRestantes: number;
  semaforo: string;
  historico: Array<{ mes: string; clientesGanados: number; ingresos: number }>;
  origenLeads: Array<{ origen: string | null; _count: { id: number } }>;
  motivosPerdida: Array<{ motivoPerdida: string | null; _count: { id: number } }>;
}

function TarjetaMetrica({ titulo, valor, icono: Icono, color = "text-marca", formato = "numero" }: {
  titulo: string; valor: number; icono: React.ElementType; color?: string; formato?: "numero" | "dinero" | "porcentaje";
}) {
  const mostrar = formato === "dinero"
    ? `$${valor.toLocaleString("es-MX")}`
    : formato === "porcentaje"
    ? `${valor}%`
    : valor.toLocaleString("es-MX");

  return (
    <Tarjeta className="flex items-start gap-4">
      <div className={`p-3 rounded-xl bg-marca-suave`}>
        <Icono className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-texto">{mostrar}</div>
        <div className="text-sm text-texto-suave">{titulo}</div>
      </div>
    </Tarjeta>
  );
}

export function DashboardContent({ sesion }: { sesion: SesionUsuario }) {
  const [datos, setDatos] = useState<DatosPanel | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setDatos(j.data); })
      .finally(() => setCargando(false));
  }, []);

  if (cargando || !datos) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonTarjeta key={i} />)}
      </div>
    );
  }

  const mesAnteriorIdx = datos.historico.length - 2;
  const mesActualIdx = datos.historico.length - 1;
  const ingresosAnterior = datos.historico[mesAnteriorIdx]?.ingresos ?? 0;
  const crecimientoIngresos = ingresosAnterior > 0
    ? Math.round(((datos.ingresosCobrados - ingresosAnterior) / ingresosAnterior) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Meta del mes */}
      <BarraMeta
        actual={datos.ingresosCobrados}
        meta={datos.metaMensual}
        diasRestantes={datos.diasRestantes}
        semaforo={datos.semaforo}
      />

      {/* Métricas principales — Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaMetrica titulo="Nuevos interesados" valor={datos.nuevosInteresados} icono={Users} />
        <TarjetaMetrica titulo="Citas agendadas" valor={datos.citasAgendadas} icono={CalendarDays} color="text-green-500" />
        <TarjetaMetrica titulo="Clientes ganados" valor={datos.clientesGanados} icono={Trophy} color="text-emerald-600" />
        <TarjetaMetrica titulo="Tasa de cierre" valor={datos.tasaCierre} icono={Target} color="text-indigo-500" formato="porcentaje" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaMetrica titulo="Cobrado este mes" valor={datos.ingresosCobrados} icono={Wallet} color="text-emerald-600" formato="dinero" />
        <TarjetaMetrica titulo="Por cobrar" valor={datos.pagosPendientes} icono={Wallet} color="text-amber-500" formato="dinero" />
        {datos.pagosVencidos > 0 && (
          <Tarjeta className="flex items-start gap-4 border-red-200 bg-red-50">
            <div className="p-3 rounded-xl bg-red-100">
              <Wallet className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-700">${datos.pagosVencidos.toLocaleString("es-MX")}</div>
              <div className="text-sm text-red-600">⚠️ Pagos vencidos</div>
            </div>
          </Tarjeta>
        )}
        <TarjetaMetrica titulo="Valor del embudo" valor={datos.valorEmbudo} icono={TrendingUp} color="text-marca" formato="dinero" />
      </div>

      {/* Crecimiento y pronóstico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Tarjeta>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-texto">Crecimiento de ingresos</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-texto">${datos.ingresosCobrados.toLocaleString("es-MX")}</span>
                  {crecimientoIngresos !== 0 && (
                    <span className={`flex items-center gap-0.5 text-sm font-medium ${crecimientoIngresos > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {crecimientoIngresos > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {Math.abs(crecimientoIngresos)}% vs mes anterior
                    </span>
                  )}
                </div>
              </div>
            </div>
            <GraficaCrecimiento historico={datos.historico} />
          </Tarjeta>
        </div>
        <Pronostico
          pronostico={datos.pronostico}
          meta={datos.metaMensual}
          cobrado={datos.ingresosCobrados}
          diasRestantes={datos.diasRestantes}
          semaforo={datos.semaforo}
        />
      </div>

      {/* Origen de leads y pérdidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tarjeta>
          <h2 className="font-semibold text-texto mb-4">De dónde llegan tus clientes</h2>
          {datos.origenLeads.length === 0 ? (
            <p className="text-texto-suave text-sm">Aún sin datos de origen este mes.</p>
          ) : (
            <div className="space-y-2">
              {datos.origenLeads.map((o) => (
                <div key={o.origen} className="flex items-center justify-between py-2 border-b border-borde last:border-0">
                  <span className="text-sm text-texto">{o.origen ?? "Sin origen"}</span>
                  <span className="text-sm font-semibold text-marca">{o._count.id} leads</span>
                </div>
              ))}
            </div>
          )}
        </Tarjeta>

        <Tarjeta>
          <h2 className="font-semibold text-texto mb-4">Por qué perdemos ventas</h2>
          {datos.motivosPerdida.length === 0 ? (
            <p className="text-texto-suave text-sm">¡Sin pérdidas registradas! 🎉</p>
          ) : (
            <div className="space-y-2">
              {datos.motivosPerdida.map((m) => (
                <div key={m.motivoPerdida} className="flex items-center justify-between py-2 border-b border-borde last:border-0">
                  <span className="text-sm text-texto">{m.motivoPerdida ?? "Sin motivo"}</span>
                  <span className="text-sm font-semibold text-red-600">{m._count.id}</span>
                </div>
              ))}
            </div>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
