"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkCliente } from "@/components/layout/link-cliente";
import { Modal } from "@/components/ui/modal";
import { Campo, Select } from "@/components/ui/campo";
import { METODOS_PAGO } from "@/lib/constantes";
import toast from "react-hot-toast";
import type { SesionUsuario } from "@/lib/auth";
import { Plus } from "lucide-react";

interface Pago {
  id: string;
  monto: number;
  montoTotal: number | null;
  metodo: string;
  estatus: string;
  fechaPago: Date | string | null;
  folio: number | null;
  notas: string | null;
  cliente: { id: string; nombre: string };
}

const estatusColor: Record<string, string> = {
  pagado: "bg-emerald-50 text-emerald-700",
  pendiente: "bg-amber-50 text-amber-700",
  vencido: "bg-red-50 text-red-700",
  cancelado: "bg-gray-100 text-gray-500",
};

export function PagosLista({ pagos: inicial, sesion }: { pagos: Pago[]; sesion: SesionUsuario }) {
  const router = useRouter();
  const [pagos, setPagos] = useState(inicial);
  const [modal, setModal] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [form, setForm] = useState({ clienteId: "", monto: "", metodo: "transferencia", estatus: "pendiente", fechaPago: "", notas: "" });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clienteId || !form.monto) { toast.error("Completa los campos obligatorios"); return; }
    setCargando(true);
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, monto: Number(form.monto) }),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error ?? "Error"); return; }
      toast.success("Pago registrado");
      setModal(false);
      router.refresh();
    } finally {
      setCargando(false);
    }
  }

  const metodosOpc = METODOS_PAGO.map((m) => ({ valor: m, etiqueta: m }));
  const estatusOpc = ["pendiente", "pagado", "vencido", "cancelado"].map((e) => ({ valor: e, etiqueta: e }));

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex justify-end">
        <Boton icono={<Plus className="h-4 w-4" />} onClick={() => setModal(true)}>Registrar pago</Boton>
      </div>

      {pagos.length === 0 ? (
        <EmptyState titulo="Sin pagos" descripcion="Registra el primer pago de un cliente." accion={{ etiqueta: "+ Registrar pago", onClick: () => setModal(true) }} />
      ) : (
        <Tarjeta>
          <div className="space-y-0">
            {pagos.map((p) => (
              <div key={p.id} className="flex items-center gap-4 py-3 border-b border-borde last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-texto">${p.monto.toLocaleString("es-MX")}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estatusColor[p.estatus] ?? ""}`}>{p.estatus}</span>
                    {p.folio != null && <span className="text-xs text-texto-suave">#{p.folio}</span>}
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-texto-suave flex-wrap">
                    <LinkCliente id={p.cliente.id} nombre={p.cliente.nombre} className="text-xs" />
                    <span>{p.metodo}</span>
                    {p.fechaPago && <span>{new Date(p.fechaPago).toLocaleDateString("es-MX")}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Tarjeta>
      )}

      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo="Registrar pago">
        <form onSubmit={crear} className="space-y-4">
          <Campo label="ID del cliente *" value={form.clienteId} onChange={(e) => set("clienteId", e.target.value)} placeholder="Pega el ID del cliente" />
          <Campo label="Monto *" type="number" value={form.monto} onChange={(e) => set("monto", e.target.value)} placeholder="5000" />
          <Select label="Método" opciones={metodosOpc} value={form.metodo} onChange={(e) => set("metodo", e.target.value)} />
          <Select label="Estatus" opciones={estatusOpc} value={form.estatus} onChange={(e) => set("estatus", e.target.value)} />
          <Campo label="Fecha de pago" type="date" value={form.fechaPago} onChange={(e) => set("fechaPago", e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Boton type="submit" cargando={cargando}>Guardar</Boton>
            <Boton type="button" variante="secundario" onClick={() => setModal(false)}>Cancelar</Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
