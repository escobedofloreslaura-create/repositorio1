import { obtenerSesionPos } from "@/lib/pos/auth";
import { CortePanel } from "@/components/pos/corte/corte-panel";

export default async function CortePage() {
  const sesion = await obtenerSesionPos();
  return <CortePanel esAdmin={sesion?.rol === "ADMINISTRADOR"} />;
}
