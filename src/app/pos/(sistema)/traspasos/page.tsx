import { redirect } from "next/navigation";
import { obtenerSesionPos, esAdminGeneral } from "@/lib/pos/auth";
import { TraspasosPanel } from "@/components/pos/traspasos/traspasos-panel";

export default async function TraspasosPage() {
  const sesion = await obtenerSesionPos();
  if (!sesion || !esAdminGeneral(sesion)) redirect("/pos");
  return <TraspasosPanel />;
}
