import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { SeguimientoHoy } from "@/components/seguimiento/seguimiento-hoy";

export const metadata = { title: "Hoy te toca" };

export default async function SeguimientoPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);

  const where = sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id, estado: "ACTIVO", eliminadoEn: null } : { estado: "ACTIVO", eliminadoEn: null };

  const [vencidos, hoyClientes, sinAccion] = await Promise.all([
    prisma.cliente.findMany({
      where: { ...where, proximaAccionFecha: { lt: new Date(new Date().setHours(0, 0, 0, 0)) } },
      select: { id: true, nombre: true, telefono: true, etapa: true, temperatura: true, proximaAccion: true, proximaAccionFecha: true, vendedor: { select: { nombre: true } } },
      orderBy: { proximaAccionFecha: "asc" },
    }),
    prisma.cliente.findMany({
      where: { ...where, proximaAccionFecha: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: hoy } },
      select: { id: true, nombre: true, telefono: true, etapa: true, temperatura: true, proximaAccion: true, proximaAccionFecha: true, vendedor: { select: { nombre: true } } },
      orderBy: { proximaAccionFecha: "asc" },
    }),
    prisma.cliente.findMany({
      where: { ...where, proximaAccion: null },
      select: { id: true, nombre: true, telefono: true, etapa: true, temperatura: true, proximaAccion: true, proximaAccionFecha: true, vendedor: { select: { nombre: true } } },
      orderBy: { ultimoContactoEn: "asc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <Header titulo="Hoy te toca" subtitulo="Tu lista de seguimiento del día" sesion={sesion} />
      <div className="p-6">
        <SeguimientoHoy vencidos={vencidos} hoy={hoyClientes} sinAccion={sinAccion} sesion={sesion} />
      </div>
    </div>
  );
}
