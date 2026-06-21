import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { PlantillasLista } from "@/components/plantillas/plantillas-lista";

export const metadata = { title: "Plantillas de mensajes" };

export default async function PlantillasPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const plantillas = await prisma.plantillaMensaje.findMany({
    where: {},
    orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
  });

  return (
    <div>
      <Header titulo="Plantillas" subtitulo="Mensajes listos para enviar por WhatsApp o correo" sesion={sesion} />
      <div className="p-6">
        <PlantillasLista plantillas={plantillas} sesion={sesion} />
      </div>
    </div>
  );
}
