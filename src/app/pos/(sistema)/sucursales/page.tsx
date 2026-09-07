import { redirect } from "next/navigation";
import { obtenerSesionPos, esAdminGeneral } from "@/lib/pos/auth";
import { SucursalesPanel } from "@/components/pos/sucursales/sucursales-panel";

export default async function SucursalesPage() {
  const sesion = await obtenerSesionPos();
  if (!sesion || !esAdminGeneral(sesion)) redirect("/pos");
  return <SucursalesPanel />;
}
