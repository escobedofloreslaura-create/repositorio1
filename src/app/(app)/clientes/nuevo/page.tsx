import { obtenerSesion } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { FormularioCliente } from "@/components/clientes/formulario-cliente";

export const metadata = { title: "Nuevo cliente" };

export default async function NuevoClientePage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  return (
    <div>
      <Header titulo="Nuevo cliente" subtitulo="Agrega un prospecto al embudo" sesion={sesion} />
      <div className="p-6">
        <FormularioCliente sesion={sesion} />
      </div>
    </div>
  );
}
