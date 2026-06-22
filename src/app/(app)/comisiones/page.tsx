import { obtenerSesion } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ComisionesPanel } from "@/components/comisiones/comisiones-panel";

export default async function ComisionesPage() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  return <ComisionesPanel sesion={sesion} />;
}
