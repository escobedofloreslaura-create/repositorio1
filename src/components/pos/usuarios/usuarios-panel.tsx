"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, UserX, UserCheck, UserCog } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonLista } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import { ModalUsuario } from "./modal-usuario";

interface UsuarioPos {
  id: string;
  nombre: string;
  usuario: string;
  rol: "ADMINISTRADOR" | "CAJERO";
  activo: boolean;
}

export function UsuariosPanel() {
  const [usuarios, setUsuarios] = useState<UsuarioPos[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState<{ usuario: UsuarioPos | null } | null>(null);

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/pos/usuarios");
    const json = await res.json();
    if (json.ok) setUsuarios(json.data);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  async function alternarActivo(u: UsuarioPos) {
    const res = await fetch(`/api/pos/usuarios/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !u.activo }),
    });
    const json = await res.json();
    if (!json.ok) return toast.error(json.error ?? "Error");
    toast.success(u.activo ? "Usuario desactivado" : "Usuario activado");
    cargar();
  }

  const admins = usuarios.filter((u) => u.rol === "ADMINISTRADOR" && u.activo).length;
  const cajeros = usuarios.filter((u) => u.rol === "CAJERO" && u.activo).length;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-xl font-bold text-texto">Usuarios</h1>
        <Boton icono={<Plus className="h-4 w-4" />} onClick={() => setModal({ usuario: null })}>Nuevo usuario</Boton>
      </div>
      <p className="text-sm text-texto-suave mb-6">{admins}/2 administradores · {cajeros}/5 cajeros activos</p>

      {cargando ? (
        <SkeletonLista filas={4} />
      ) : usuarios.length === 0 ? (
        <EmptyState icono={<UserCog className="h-8 w-8" />} titulo="Sin usuarios" />
      ) : (
        <div className="space-y-2">
          {usuarios.map((u) => (
            <div key={u.id} className={`flex items-center gap-3 rounded-xl border border-borde bg-surface p-4 ${!u.activo ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-texto">{u.nombre}</div>
                <div className="text-xs text-texto-suave">@{u.usuario}</div>
              </div>
              <Badge variante={u.rol === "ADMINISTRADOR" ? "marca" : "neutro"}>{u.rol === "ADMINISTRADOR" ? "Administrador" : "Cajero"}</Badge>
              {!u.activo && <Badge variante="peligro">Inactivo</Badge>}
              <div className="flex gap-1">
                <button onClick={() => setModal({ usuario: u })} className="p-1.5 rounded-lg hover:bg-surface-hover text-texto-suave" title="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => alternarActivo(u)}
                  className="p-1.5 rounded-lg hover:bg-surface-hover text-texto-suave"
                  title={u.activo ? "Desactivar" : "Activar"}
                >
                  {u.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ModalUsuario usuario={modal.usuario} onCerrar={() => setModal(null)} onGuardado={() => { setModal(null); cargar(); }} />
      )}
    </div>
  );
}
