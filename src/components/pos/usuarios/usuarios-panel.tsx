"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, UserX, UserCheck, UserCog } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonLista } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import { ModalUsuario } from "./modal-usuario";
import type { PosSucursalT } from "@/lib/pos/tipos";

export interface UsuarioPos {
  id: string;
  nombre: string;
  usuario: string;
  rol: "ADMINISTRADOR" | "CAJERO";
  sucursalId: string | null;
  sucursal?: { nombre: string } | null;
  activo: boolean;
}

const LIMITE_ADMIN_GENERAL = 2;
const LIMITE_ADMINISTRADORES = 2;
const LIMITE_CAJEROS = 5;

export function UsuariosPanel({ esAdminGeneral }: { esAdminGeneral: boolean }) {
  const [usuarios, setUsuarios] = useState<UsuarioPos[]>([]);
  const [sucursales, setSucursales] = useState<PosSucursalT[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState<{ usuario: UsuarioPos | null } | null>(null);

  async function cargar() {
    setCargando(true);
    const peticiones = [fetch("/api/pos/usuarios")];
    if (esAdminGeneral) peticiones.push(fetch("/api/pos/sucursales"));
    const respuestas = await Promise.all(peticiones);
    const [jsonUsuarios, jsonSucursales] = await Promise.all(respuestas.map((r) => r.json()));
    if (jsonUsuarios.ok) setUsuarios(jsonUsuarios.data);
    if (esAdminGeneral && jsonSucursales?.ok) setSucursales(jsonSucursales.data);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function fila(u: UsuarioPos) {
    return (
      <div key={u.id} className={`flex items-center gap-3 rounded-xl border border-borde bg-surface p-4 ${!u.activo ? "opacity-50" : ""}`}>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-texto">{u.nombre}</div>
          <div className="text-xs text-texto-suave">@{u.usuario}{u.sucursal ? ` · ${u.sucursal.nombre}` : ""}</div>
        </div>
        <Badge variante={u.rol === "ADMINISTRADOR" ? "marca" : "neutro"}>
          {u.rol === "ADMINISTRADOR" ? (u.sucursalId === null ? "Administrador General" : "Administrador") : "Cajero"}
        </Badge>
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
    );
  }

  const admins = usuarios.filter((u) => u.rol === "ADMINISTRADOR" && u.sucursalId !== null && u.activo).length;
  const cajeros = usuarios.filter((u) => u.rol === "CAJERO" && u.activo).length;
  const adminsGenerales = usuarios.filter((u) => u.sucursalId === null && u.activo).length;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="text-xl font-bold text-texto">Usuarios</h1>
        <Boton icono={<Plus className="h-4 w-4" />} onClick={() => setModal({ usuario: null })}>Nuevo usuario</Boton>
      </div>

      {cargando ? (
        <SkeletonLista filas={4} />
      ) : usuarios.length === 0 ? (
        <EmptyState icono={<UserCog className="h-8 w-8" />} titulo="Sin usuarios" />
      ) : esAdminGeneral ? (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-texto-suave mb-3">{adminsGenerales}/{LIMITE_ADMIN_GENERAL} administradores generales activos</p>
            <div className="space-y-2">
              {usuarios.filter((u) => u.sucursalId === null).map(fila)}
            </div>
          </div>
          {sucursales.map((s) => {
            const deLaSucursal = usuarios.filter((u) => u.sucursalId === s.id);
            const adminsSucursal = deLaSucursal.filter((u) => u.rol === "ADMINISTRADOR" && u.activo).length;
            const cajerosSucursal = deLaSucursal.filter((u) => u.rol === "CAJERO" && u.activo).length;
            return (
              <div key={s.id}>
                <p className="text-sm font-semibold text-texto mb-1">{s.nombre}</p>
                <p className="text-xs text-texto-suave mb-3">
                  {adminsSucursal}/{LIMITE_ADMINISTRADORES} administradores · {cajerosSucursal}/{LIMITE_CAJEROS} cajeros activos
                </p>
                <div className="space-y-2">
                  {deLaSucursal.length === 0 ? (
                    <p className="text-xs text-texto-muy-suave">Sin usuarios en esta sucursal.</p>
                  ) : (
                    deLaSucursal.map(fila)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <p className="text-sm text-texto-suave mb-6">{admins}/{LIMITE_ADMINISTRADORES} administradores · {cajeros}/{LIMITE_CAJEROS} cajeros activos</p>
          <div className="space-y-2">{usuarios.map(fila)}</div>
        </div>
      )}

      {modal && (
        <ModalUsuario
          usuario={modal.usuario}
          esAdminGeneral={esAdminGeneral}
          sucursales={sucursales}
          onCerrar={() => setModal(null)}
          onGuardado={() => { setModal(null); cargar(); }}
        />
      )}
    </div>
  );
}
