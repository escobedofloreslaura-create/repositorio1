import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ClientesLista } from "@/components/clientes/clientes-lista";

export const metadata = { title: "Clientes ganados" };

export default async function CompletadosPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  return (
    <div>
      <Header titulo="Ganados 🎉" subtitulo="Clientes que cerraron" sesion={sesion} />
      <div className="p-6">
        <ClientesLista sesion={sesion} estadoInicial="GANADO" />
      </div>
    </div>
  );
}
