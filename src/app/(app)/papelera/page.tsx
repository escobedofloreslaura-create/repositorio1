import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { PapeleraLista } from "@/components/papelera/papelera-lista";

export const metadata = { title: "Papelera" };

export default async function PapeleraPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const where = sesion.rol === "VENDEDOR"
    ? { vendedorId: sesion.id, eliminadoEn: { gte: hace30Dias } }
    : { eliminadoEn: { gte: hace30Dias } };

  const eliminados = await prisma.cliente.findMany({
    where,
    select: { id: true, nombre: true, etapa: true, estado: true, temperatura: true, eliminadoEn: true },
    orderBy: { eliminadoEn: "desc" },
  });

  return (
    <div>
      <Header titulo="Papelera" subtitulo="Clientes eliminados en los últimos 30 días" sesion={sesion} />
      <div className="p-6">
        <PapeleraLista eliminados={eliminados} sesion={sesion} />
      </div>
    </div>
  );
}
