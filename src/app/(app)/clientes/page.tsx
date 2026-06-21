import { obtenerSesion } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { ClientesLista } from "@/components/clientes/clientes-lista";

export const metadata = { title: "Clientes" };

export default async function ClientesPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  return (
    <div>
      <Header titulo="Clientes" subtitulo="Todas tus personas en un solo lugar" sesion={sesion} />
      <div className="p-6">
        <ClientesLista sesion={sesion} />
      </div>
    </div>
  );
}
