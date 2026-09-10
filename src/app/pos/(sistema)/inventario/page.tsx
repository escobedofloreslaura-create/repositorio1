import { redirect } from "next/navigation";
import { obtenerSesionPos, esAdminGeneral } from "@/lib/pos/auth";
import { InventarioPanel } from "@/components/pos/inventario/inventario-panel";

export default async function InventarioPage() {
  const sesion = await obtenerSesionPos();
  if (sesion?.rol !== "ADMINISTRADOR") redirect("/pos");
  return <InventarioPanel puedeImportar={esAdminGeneral(sesion)} />;
}
