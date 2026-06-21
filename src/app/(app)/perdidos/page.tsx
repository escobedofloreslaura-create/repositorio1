import { obtenerSesion } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { ClientesLista } from "@/components/clientes/clientes-lista";

export const metadata = { title: "Clientes perdidos" };

export default async function PerdidosPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  return (
    <div>
      <Header titulo="Perdidos" subtitulo="Ventas que no se cerraron" sesion={sesion} />
      <div className="p-6">
        <ClientesLista sesion={sesion} estadoInicial="PERDIDO" />
      </div>
    </div>
  );
}
