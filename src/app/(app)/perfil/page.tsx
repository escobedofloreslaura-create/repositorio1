import { obtenerSesion } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { PerfilForm } from "@/components/perfil/perfil-form";

export const metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  return (
    <div>
      <Header titulo="Mi perfil" subtitulo="Actualiza tus datos y preferencias" sesion={sesion} />
      <div className="p-6">
        <PerfilForm sesion={sesion} />
      </div>
    </div>
  );
}
