import { redirect } from "next/navigation";
import { obtenerSesionPos, esAdminGeneral } from "@/lib/pos/auth";
import { UsuariosPanel } from "@/components/pos/usuarios/usuarios-panel";

export default async function UsuariosPage() {
  const sesion = await obtenerSesionPos();
  if (sesion?.rol !== "ADMINISTRADOR") redirect("/pos");
  return <UsuariosPanel esAdminGeneral={esAdminGeneral(sesion)} />;
}
