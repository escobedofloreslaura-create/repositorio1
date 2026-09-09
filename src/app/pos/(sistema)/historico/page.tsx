import { redirect } from "next/navigation";
import { obtenerSesionPos } from "@/lib/pos/auth";
import { HistoricoPanel } from "@/components/pos/historico/historico-panel";

export default async function HistoricoPage() {
  const sesion = await obtenerSesionPos();
  if (sesion?.rol !== "ADMINISTRADOR") redirect("/pos");
  return <HistoricoPanel />;
}
