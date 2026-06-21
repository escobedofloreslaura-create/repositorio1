import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { AgendaVista } from "@/components/agenda/agenda-vista";

export const metadata = { title: "Agenda" };

export default async function AgendaPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0);

  const where = sesion.rol === "VENDEDOR"
    ? { cliente: { vendedorId: sesion.id }, eliminadoEn: null, fecha: { gte: inicio, lte: fin } }
    : { eliminadoEn: null, fecha: { gte: inicio, lte: fin } };

  const citas = await prisma.cita.findMany({
    where,
    include: { cliente: { select: { id: true, nombre: true } } },
    orderBy: { fecha: "asc" },
  });

  return (
    <div>
      <Header titulo="Agenda" subtitulo={`${citas.length} citas este y próximo mes`} sesion={sesion} />
      <div className="p-6">
        <AgendaVista citas={citas} sesion={sesion} />
      </div>
    </div>
  );
}
