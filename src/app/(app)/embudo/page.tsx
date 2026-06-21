import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { EmbudoKanban } from "@/components/embudo/embudo-kanban";

export const metadata = { title: "Embudo de ventas" };

export default async function EmbudoPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const where = sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id, estado: "ACTIVO", eliminadoEn: null } : { estado: "ACTIVO", eliminadoEn: null };

  const clientes = await prisma.cliente.findMany({
    where,
    select: {
      id: true, nombre: true, etapa: true, temperatura: true,
      valorEstimado: true, proximaAccion: true, proximaAccionFecha: true,
      telefono: true, vendedor: { select: { nombre: true } },
    },
    orderBy: { creadoEn: "desc" },
  });

  return (
    <div className="h-full flex flex-col">
      <Header titulo="Embudo" subtitulo={`${clientes.length} prospectos activos`} sesion={sesion} />
      <div className="flex-1 overflow-hidden p-6">
        <EmbudoKanban clientes={clientes} sesion={sesion} />
      </div>
    </div>
  );
}
