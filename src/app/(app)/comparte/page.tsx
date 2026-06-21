import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { CompartePanel } from "@/components/comparte/comparte-panel";

export const metadata = { title: "Comparte y crece" };

export default async function CompartePage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const config = await prisma.configNegocio.findFirst();
  const vendedores = sesion.rol === "ADMIN"
    ? await prisma.usuario.findMany({ where: { activo: true }, select: { id: true, nombre: true, paginaAgendaSlug: true } })
    : [{ id: sesion.id, nombre: sesion.nombre, paginaAgendaSlug: null }];

  return (
    <div>
      <Header titulo="Comparte y crece" subtitulo="Links, QR y rastreo de origen" sesion={sesion} />
      <div className="p-6">
        <CompartePanel vendedores={vendedores} config={config} sesion={sesion} />
      </div>
    </div>
  );
}
