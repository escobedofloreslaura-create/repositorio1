"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import toast from "react-hot-toast";
import type { Metadata } from "next";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Error al iniciar sesión");
        return;
      }
      toast.success(`¡Bienvenido, ${json.data.nombre}!`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-fondo">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-marca text-white font-bold text-xl mb-4 shadow-lg">LP</div>
          <h1 className="text-2xl font-bold text-texto">LEF PATRIMONIAL</h1>
          <p className="text-texto-suave mt-1">Entra a tu CRM</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-surface border border-borde rounded-2xl p-6 shadow-sm space-y-4">
          <Campo
            label="Correo electrónico"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            placeholder="tu@correo.com"
            autoComplete="email"
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-texto">Contraseña</label>
            <div className="relative">
              <input
                type={verContrasena ? "text" : "password"}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-borde bg-surface px-4 py-2.5 pr-10 text-sm text-texto placeholder:text-texto-muy-suave focus:outline-none focus:ring-2 focus:ring-marca/30 focus:border-marca"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setVerContrasena(!verContrasena)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-texto-suave hover:text-texto"
                aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {verContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Boton
            type="submit"
            variante="primario"
            tamano="lg"
            cargando={cargando}
            icono={<LogIn className="h-4 w-4" />}
            className="w-full"
          >
            Entrar al CRM
          </Boton>
        </form>

        <p className="text-center text-xs text-texto-muy-suave mt-6">
          LEF PATRIMONIAL · Asesoría financiera y seguros
        </p>
      </div>
    </div>
  );
}
