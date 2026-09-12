"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Campo, Select } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import toast from "react-hot-toast";
import type { PosSucursalT } from "@/lib/pos/tipos";
import type { UsuarioPos } from "./usuarios-panel";

export function ModalUsuario({
  usuario,
  esAdminGeneral,
  sucursales,
  onCerrar,
  onGuardado,
}: {
  usuario: UsuarioPos | null;
  /** Si quien gestiona es el Administrador General, puede elegir la sucursal del usuario (o dejarlo sin una para crear otro Administrador General). */
  esAdminGeneral: boolean;
  sucursales: PosSucursalT[];
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [nombreUsuario, setNombreUsuario] = useState(usuario?.usuario ?? "");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState<"ADMINISTRADOR" | "CAJERO">(usuario?.rol ?? "CAJERO");
  const [sucursalId, setSucursalId] = useState<string>(usuario?.sucursalId ?? sucursales[0]?.id ?? "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Solo el Administrador General puede crear/editar a otro Administrador
  // General (sin sucursal). Un administrador de tienda existente no puede
  // ser reasignado desde aquí a "sin sucursal".
  const puedeElegirSucursal = esAdminGeneral && !(usuario && usuario.sucursalId === null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const sucursalFinal = puedeElegirSucursal ? (sucursalId || null) : undefined;
      const res = await fetch(usuario ? `/api/pos/usuarios/${usuario.id}` : "/api/pos/usuarios", {
        method: usuario ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          usuario
            ? { nombre, rol, ...(contrasena ? { contrasena } : {}) }
            : { nombre, usuario: nombreUsuario, contrasena, rol, ...(sucursalFinal !== undefined ? { sucursalId: sucursalFinal } : {}) }
        ),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Error al guardar");
        return;
      }
      toast.success(usuario ? "Usuario actualizado" : "Usuario creado");
      onGuardado();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo={usuario ? "Editar usuario" : "Nuevo usuario"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Campo label="Nombre completo" required value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
        <Campo
          label="Usuario (para iniciar sesión)"
          required
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          disabled={!!usuario}
        />
        <Campo
          label={usuario ? "Nueva contraseña" : "Contraseña"}
          type="password"
          required={!usuario}
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          helpText={usuario ? "Déjalo vacío para no cambiarla" : "Mínimo 6 caracteres"}
        />
        <Select
          label="Rol"
          value={rol}
          onChange={(e) => setRol(e.target.value as typeof rol)}
          opciones={[
            { valor: "CAJERO", etiqueta: "Cajero (máximo 5 por sucursal)" },
            { valor: "ADMINISTRADOR", etiqueta: "Administrador (máximo 2 por sucursal)" },
          ]}
        />
        {!usuario && puedeElegirSucursal && (
          <Select
            label="Sucursal"
            value={sucursalId}
            onChange={(e) => setSucursalId(e.target.value)}
            opciones={[
              ...sucursales.map((s) => ({ valor: s.id, etiqueta: s.nombre })),
              ...(rol === "ADMINISTRADOR" ? [{ valor: "", etiqueta: "Ninguna — Administrador General (máximo 2)" }] : []),
            ]}
            helpText={sucursalId === "" ? "Sin sucursal fija: podrá elegir cualquiera y gestionar catálogo, precios y traspasos." : undefined}
          />
        )}
        {usuario && usuario.sucursalId === null && (
          <p className="text-xs text-texto-suave">Este usuario es Administrador General (sin sucursal fija).</p>
        )}
        {error && <p className="text-sm text-peligro">{error}</p>}
        <div className="flex gap-2">
          <Boton type="button" variante="secundario" className="flex-1" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" variante="primario" className="flex-1" cargando={cargando}>Guardar</Boton>
        </div>
      </form>
    </Modal>
  );
}
