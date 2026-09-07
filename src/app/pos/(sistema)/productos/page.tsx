import { obtenerSesionPos, esAdminGeneral } from "@/lib/pos/auth";
import { ProductosPanel } from "@/components/pos/productos/productos-panel";

export default async function ProductosPage() {
  const sesion = await obtenerSesionPos();
  return (
    <ProductosPanel
      puedeEditarCatalogo={!!sesion && esAdminGeneral(sesion)}
      puedeAjustarInventario={sesion?.rol === "ADMINISTRADOR"}
    />
  );
}
