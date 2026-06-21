import { notFound } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ExpedienteCliente } from "@/components/clientes/expediente-cliente";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      vendedor: { select: { id: true, nombre: true } },
      citas: { where: { eliminadoEn: null }, orderBy: { fecha: "desc" } },
      pagos: { where: { eliminadoEn: null }, orderBy: { creadoEn: "desc" } },
      historial: {
        include: { usuario: { select: { id: true, nombre: true } } },
        orderBy: { fecha: "desc" },
      },
      archivos: {
        select: { id: true, nombre: true, etiqueta: true, tipo: true, tamanio: true, creadoEn: true, subidoPor: { select: { nombre: true } } },
        orderBy: { creadoEn: "desc" },
      },
      etiquetasCliente: { include: { etiqueta: true } },
    },
  });

  if (!cliente || cliente.eliminadoEn) notFound();

  return (
    <div>
      <Header titulo={cliente.nombre} subtitulo={`${cliente.etapa} · ${cliente.temperatura}`} sesion={sesion} />
      <div className="p-6">
        <ExpedienteCliente cliente={cliente as unknown as Parameters<typeof ExpedienteCliente>[0]["cliente"]} sesion={sesion} />
      </div>
    </div>
  );
}
