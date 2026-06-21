import { Suspense } from "react";
import { obtenerSesion } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { SkeletonTarjeta } from "@/components/ui/skeleton";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const metadata = { title: "Tablero" };

export default async function DashboardPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div>
      <Header
        titulo={`${saludo}, ${sesion.nombre.split(" ")[0]} ☀️`}
        subtitulo="¿Vas a cerrar el mes?"
        sesion={sesion}
      />
      <div className="p-6">
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonTarjeta key={i} />)}
          </div>
        }>
          <DashboardContent sesion={sesion} />
        </Suspense>
      </div>
    </div>
  );
}
