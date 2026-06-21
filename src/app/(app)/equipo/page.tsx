import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { EquipoPanel } from "@/components/equipo/equipo-panel";
import { redirect } from "next/navigation";

export const metadata = { title: "Equipo" };

export default async function EquipoPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  if (sesion.rol !== "ADMIN") redirect("/dashboard");

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const vendedores = await prisma.usuario.findMany({
    where: { activo: true },
    select: {
      id: true, nombre: true, correo: true, rol: true,
      clientes: {
        where: { eliminadoEn: null },
        select: { id: true, estado: true, valorEstimado: true, creadoEn: true },
      },
    },
  });

  return (
    <div>
      <Header titulo="Equipo" subtitulo="Ranking y métricas por vendedor" sesion={sesion} />
      <div className="p-6">
        <EquipoPanel vendedores={vendedores} inicioMes={inicioMes.toISOString()} />
      </div>
    </div>
  );
}
