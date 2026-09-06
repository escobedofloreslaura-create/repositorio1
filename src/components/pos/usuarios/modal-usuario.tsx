"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Campo, Select } from "@/components/ui/campo";
import { Boton } from "@/components/ui/boton";
import toast from "react-hot-toast";

interface UsuarioPos {
  id: string;
  nombre: string;
  usuario: string;
  rol: "ADMINISTRADOR" | "CAJERO";
  activo: boolean;
}

export function ModalUsuario({ usuario, onCerrar, onGuardado }: { usuario: UsuarioPos | null; onCerrar: () => void; onGuardado: () => void }) {
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [nombreUsuario, setNombreUsuario] = useState(usuario?.usuario ?? "");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState<"ADMINISTRADOR" | "CAJERO">(usuario?.rol ?? "CAJERO");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const res = await fetch(usuario ? `/api/pos/usuarios/${usuario.id}` : "/api/pos/usuarios", {
        method: usuario ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          usuario
            ? { nombre, rol, ...(contrasena ? { contrasena } : {}) }
            : { nombre, usuario: nombreUsuario, contrasena, rol }
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
            { valor: "CAJERO", etiqueta: "Cajero (máximo 5)" },
            { valor: "ADMINISTRADOR", etiqueta: "Administrador (máximo 2)" },
          ]}
        />
        {error && <p className="text-sm text-peligro">{error}</p>}
        <div className="flex gap-2">
          <Boton type="button" variante="secundario" className="flex-1" onClick={onCerrar}>Cancelar</Boton>
          <Boton type="submit" variante="primario" className="flex-1" cargando={cargando}>Guardar</Boton>
        </div>
      </form>
    </Modal>
  );
}
