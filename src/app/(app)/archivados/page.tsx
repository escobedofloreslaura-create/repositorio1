import { obtenerSesion } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { ClientesLista } from "@/components/clientes/clientes-lista";

export const metadata = { title: "Archivados" };

export default async function ArchivadosPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  return (
    <div>
      <Header titulo="Archivados" subtitulo="Puedes restaurarlos cuando quieras" sesion={sesion} />
      <div className="p-6">
        <ClientesLista sesion={sesion} estadoInicial="ARCHIVADO" />
      </div>
    </div>
  );
}
