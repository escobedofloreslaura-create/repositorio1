"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { Modal } from "@/components/ui/modal";
import { Campo, Select } from "@/components/ui/campo";
import { formatearFechaHumana } from "@/lib/formato";
import toast from "react-hot-toast";
import { Plus, UserCheck, UserX } from "lucide-react";
import type { SesionUsuario } from "@/lib/auth";

interface Usuario { id: string; nombre: string; correo: string; rol: string; activo: boolean; creadoEn: Date | string; }
interface Auditoria { id: string; accion: string; recursoTipo: string; recursoId: string | null; creadoEn: Date | string; usuario: { nombre: string } | null; }

export function AdminPanel({ usuarios, auditoria, sesion }: { usuarios: Usuario[]; auditoria: Auditoria[]; sesion: SesionUsuario }) {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [form, setForm] = useState({ nombre: "", correo: "", contrasena: "", rol: "VENDEDOR" });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.correo || !form.contrasena) { toast.error("Completa todos los campos"); return; }
    setCargando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error ?? "Error"); return; }
      toast.success("Usuario creado");
      setModal(false);
      setForm({ nombre: "", correo: "", contrasena: "", rol: "VENDEDOR" });
      router.refresh();
    } finally {
      setCargando(false);
    }
  }

  async function toggleActivo(id: string, activo: boolean) {
    await fetch(`/api/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    toast.success(activo ? "Usuario desactivado" : "Usuario activado");
    router.refresh();
  }

  const rolOpc = [{ valor: "ADMIN", etiqueta: "Admin" }, { valor: "VENDEDOR", etiqueta: "Vendedor" }, { valor: "LECTURA", etiqueta: "Solo lectura" }];

  return (
    <div className="max-w-4xl space-y-8">
      <Tarjeta>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-texto">Usuarios — {usuarios.length}</h2>
          <Boton icono={<Plus className="h-4 w-4" />} tamano="sm" onClick={() => setModal(true)}>Nuevo usuario</Boton>
        </div>
        <div className="space-y-0">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center gap-4 py-3 border-b border-borde last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-texto text-sm">{u.nombre}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-texto-suave">{u.rol}</span>
                  {!u.activo && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">Inactivo</span>}
                </div>
                <p className="text-xs text-texto-suave">{u.correo} · desde {new Date(u.creadoEn).toLocaleDateString("es-MX")}</p>
              </div>
              {u.id !== sesion.id && (
                <button onClick={() => toggleActivo(u.id, u.activo)}
                  className="p-1.5 rounded-lg hover:bg-surface-hover text-texto-suave transition-colors">
                  {u.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4 text-emerald-600" />}
                </button>
              )}
            </div>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta>
        <h2 className="font-semibold text-texto mb-4">Auditoría reciente</h2>
        <div className="space-y-0">
          {auditoria.map((a) => (
            <div key={a.id} className="flex items-start gap-3 py-2 border-b border-borde last:border-0 text-sm">
              <div className="flex-1">
                <span className="font-medium text-texto">{a.accion}</span>
                <span className="text-texto-suave ml-2">{a.recursoTipo} {a.recursoId ?? ""}</span>
              </div>
              <div className="text-xs text-texto-suave text-right whitespace-nowrap">
                <div>{a.usuario?.nombre ?? "Sistema"}</div>
                <div>{formatearFechaHumana(a.creadoEn)}</div>
              </div>
            </div>
          ))}
          {auditoria.length === 0 && <p className="text-sm text-texto-suave">Sin registros aún</p>}
        </div>
      </Tarjeta>

      <Modal abierto={modal} onCerrar={() => setModal(false)} titulo="Nuevo usuario">
        <form onSubmit={crear} className="space-y-4">
          <Campo label="Nombre *" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Ana López" />
          <Campo label="Correo *" type="email" value={form.correo} onChange={(e) => set("correo", e.target.value)} placeholder="ana@lefpatrimonial.com" />
          <Campo label="Contraseña *" type="password" value={form.contrasena} onChange={(e) => set("contrasena", e.target.value)} placeholder="Mínimo 8 caracteres" />
          <Select label="Rol" opciones={rolOpc} value={form.rol} onChange={(e) => set("rol", e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Boton type="submit" cargando={cargando}>Crear usuario</Boton>
            <Boton type="button" variante="secundario" onClick={() => setModal(false)}>Cancelar</Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
