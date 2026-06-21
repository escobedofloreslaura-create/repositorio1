"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Campo, Select, Textarea } from "@/components/ui/campo";
import { ETAPAS_EMBUDO, TEMPERATURAS, OBJECIONES } from "@/lib/constantes";
import toast from "react-hot-toast";
import type { SesionUsuario } from "@/lib/auth";

interface ClienteEditable {
  id?: string;
  nombre: string;
  telefono: string;
  correo: string;
  etapa: string;
  temperatura: string;
  objecionPrincipal: string;
  valorEstimado: string;
  notas: string;
  proximaAccion: string;
  proximaAccionFecha: string;
  empresaNombre: string;
  empresaPuesto: string;
  origen: string;
}

const VACIO: ClienteEditable = {
  nombre: "", telefono: "", correo: "", etapa: "Nuevo", temperatura: "Frio",
  objecionPrincipal: "", valorEstimado: "", notas: "", proximaAccion: "",
  proximaAccionFecha: "", empresaNombre: "", empresaPuesto: "", origen: "",
};

export function FormularioCliente({ sesion, inicial }: { sesion: SesionUsuario; inicial?: Partial<ClienteEditable> & { id?: string } }) {
  const router = useRouter();
  const [form, setForm] = useState<ClienteEditable>({ ...VACIO, ...inicial });
  const [cargando, setCargando] = useState(false);
  const editando = !!inicial?.id;

  function set(k: keyof ClienteEditable, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    setCargando(true);
    try {
      const url = editando ? `/api/clientes/${inicial!.id}` : "/api/clientes";
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          valorEstimado: form.valorEstimado ? Number(form.valorEstimado) : null,
        }),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error ?? "Error al guardar"); return; }
      toast.success(editando ? "Cliente actualizado" : "Cliente creado");
      router.push(editando ? `/clientes/${inicial!.id}` : `/clientes/${json.data.id}`);
      router.refresh();
    } finally {
      setCargando(false);
    }
  }

  const etapasOpc = ETAPAS_EMBUDO.map((e) => ({ valor: e, etiqueta: e }));
  const tempOpc = TEMPERATURAS.map((t) => ({ valor: t, etiqueta: t === "Caliente" ? "🔥 Caliente" : t === "Tibio" ? "🟡 Tibio" : "🔵 Frío" }));
  const objecOpc = [{ valor: "", etiqueta: "Sin objeción" }, ...OBJECIONES.map((o) => ({ valor: o, etiqueta: o }))];
  const origenOpc = [
    { valor: "", etiqueta: "No especificado" },
    ...["Referido", "Facebook", "Instagram", "WhatsApp", "Google", "Evento", "Llamada fría", "Otro"].map((o) => ({ valor: o, etiqueta: o })),
  ];

  return (
    <form onSubmit={guardar} className="max-w-2xl space-y-6">
      <Tarjeta>
        <h2 className="font-semibold text-texto mb-4">Datos personales</h2>
        <div className="space-y-4">
          <Campo label="Nombre completo *" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Juan García López" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Teléfono" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+52 222 123 4567" />
            <Campo label="Correo" type="email" value={form.correo} onChange={(e) => set("correo", e.target.value)} placeholder="juan@empresa.com" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Empresa" value={form.empresaNombre} onChange={(e) => set("empresaNombre", e.target.value)} placeholder="Nombre de la empresa" />
            <Campo label="Puesto" value={form.empresaPuesto} onChange={(e) => set("empresaPuesto", e.target.value)} placeholder="Director comercial" />
          </div>
        </div>
      </Tarjeta>

      <Tarjeta>
        <h2 className="font-semibold text-texto mb-4">Embudo y clasificación</h2>
        <div className="space-y-4">
          <Select label="Etapa en el embudo" opciones={etapasOpc} value={form.etapa} onChange={(e) => set("etapa", e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Temperatura" opciones={tempOpc} value={form.temperatura} onChange={(e) => set("temperatura", e.target.value)} />
            <Campo label="Valor estimado ($)" type="number" value={form.valorEstimado} onChange={(e) => set("valorEstimado", e.target.value)} placeholder="50000" />
          </div>
          <Select label="Objeción principal" opciones={objecOpc} value={form.objecionPrincipal} onChange={(e) => set("objecionPrincipal", e.target.value)} />
          <Select label="Origen del lead" opciones={origenOpc} value={form.origen} onChange={(e) => set("origen", e.target.value)} />
        </div>
      </Tarjeta>

      <Tarjeta>
        <h2 className="font-semibold text-texto mb-4">Seguimiento</h2>
        <div className="space-y-4">
          <Campo label="Próxima acción" value={form.proximaAccion} onChange={(e) => set("proximaAccion", e.target.value)} placeholder="Enviar propuesta por WhatsApp" />
          <Campo label="Fecha de próxima acción" type="date" value={form.proximaAccionFecha} onChange={(e) => set("proximaAccionFecha", e.target.value)} />
          <Textarea label="Notas" value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Información adicional relevante..." rows={3} />
        </div>
      </Tarjeta>

      <div className="flex gap-3">
        <Boton type="submit" cargando={cargando}>{editando ? "Guardar cambios" : "Crear cliente"}</Boton>
        <Boton type="button" variante="secundario" onClick={() => router.back()}>Cancelar</Boton>
      </div>
    </form>
  );
}
