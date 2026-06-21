"use client";
import { useState } from "react";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { SelectorTema } from "@/components/ui/selector-tema";
import toast from "react-hot-toast";
import type { SesionUsuario } from "@/lib/auth";

export function PerfilForm({ sesion }: { sesion: SesionUsuario }) {
  const [nombre, setNombre] = useState(sesion.nombre);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [cargando, setCargando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    try {
      const body: Record<string, string> = { nombre };
      if (passwordNuevo) {
        if (!passwordActual) { toast.error("Ingresa tu contraseña actual"); return; }
        body.passwordActual = passwordActual;
        body.passwordNuevo = passwordNuevo;
      }
      const res = await fetch(`/api/usuarios/${sesion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) { toast.error(json.error ?? "Error al guardar"); return; }
      toast.success("Perfil actualizado");
      setPasswordActual(""); setPasswordNuevo("");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <Tarjeta>
        <h2 className="font-semibold text-texto mb-4">Información personal</h2>
        <form onSubmit={guardar} className="space-y-4">
          <Campo label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Campo label="Correo" value={sesion.correo} disabled />
          <Campo label="Rol" value={sesion.rol} disabled />
          <h3 className="font-medium text-texto pt-2">Cambiar contraseña</h3>
          <Campo label="Contraseña actual" type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} placeholder="Dejar vacío para no cambiar" />
          <Campo label="Nueva contraseña" type="password" value={passwordNuevo} onChange={(e) => setPasswordNuevo(e.target.value)} placeholder="Mínimo 8 caracteres" />
          <Boton type="submit" cargando={cargando}>Guardar cambios</Boton>
        </form>
      </Tarjeta>

      <Tarjeta>
        <h2 className="font-semibold text-texto mb-4">Apariencia</h2>
        <SelectorTema />
      </Tarjeta>
    </div>
  );
}
