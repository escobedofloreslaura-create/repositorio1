import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AgendaPublica } from "@/components/agenda/agenda-publica";

export default async function AgendaPublicaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const vendedor = await prisma.usuario.findFirst({
    where: { id: slug, activo: true },
    select: { id: true, nombre: true },
  });

  if (!vendedor) notFound();

  const hoy = new Date();
  const en30dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

  const citasOcupadas = await prisma.cita.findMany({
    where: {
      cliente: { vendedorId: vendedor.id },
      fecha: { gte: hoy, lte: en30dias },
      estado: { not: "cancelada" },
      eliminadoEn: null,
    },
    select: { fecha: true },
  });

  return (
    <AgendaPublica
      vendedor={vendedor}
      citasOcupadas={citasOcupadas.map((c: { fecha: Date }) => c.fecha.toISOString())}
    />
  );
}
