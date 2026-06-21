import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ConfigPanel } from "@/components/configuracion/config-panel";
import { redirect } from "next/navigation";

export const metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  if (sesion.rol !== "ADMIN") redirect("/dashboard");

  const config = await prisma.configNegocio.findFirst();

  return (
    <div>
      <Header titulo="Configuración" subtitulo="Ajustes del negocio" sesion={sesion} />
      <div className="p-6">
        <ConfigPanel config={config} />
      </div>
    </div>
  );
}
