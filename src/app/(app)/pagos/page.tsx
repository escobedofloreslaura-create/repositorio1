import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { PagosLista } from "@/components/pagos/pagos-lista";

export const metadata = { title: "Pagos" };

export default async function PagosPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const where = sesion.rol === "VENDEDOR" ? { cliente: { vendedorId: sesion.id }, eliminadoEn: null } : { eliminadoEn: null };

  const pagos = await prisma.pago.findMany({
    where,
    include: { cliente: { select: { id: true, nombre: true } } },
    orderBy: { creadoEn: "desc" },
    take: 100,
  });

  const totalCobrado = pagos.filter((p: { estatus: string }) => p.estatus === "pagado").reduce((s: number, p: { monto: number }) => s + p.monto, 0);
  const totalPendiente = pagos.filter((p: { estatus: string }) => p.estatus === "pendiente").reduce((s: number, p: { monto: number }) => s + p.monto, 0);

  return (
    <div>
      <Header titulo="Pagos" subtitulo={`$${totalCobrado.toLocaleString("es-MX")} cobrado · $${totalPendiente.toLocaleString("es-MX")} pendiente`} sesion={sesion} />
      <div className="p-6">
        <PagosLista pagos={pagos} sesion={sesion} />
      </div>
    </div>
  );
}
