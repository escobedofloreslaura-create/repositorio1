import { redirect } from "next/navigation";
import { obtenerSesionPos } from "@/lib/pos/auth";
import { ConfiguracionPanel } from "@/components/pos/configuracion/configuracion-panel";

export default async function ConfiguracionPage() {
  const sesion = await obtenerSesionPos();
  if (sesion?.rol !== "ADMINISTRADOR") redirect("/pos");
  return <ConfiguracionPanel />;
}
