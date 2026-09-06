import { redirect } from "next/navigation";
import { obtenerSesionPos } from "@/lib/pos/auth";
import { PosSidebar } from "@/components/pos/layout/pos-sidebar";

export default async function PosSistemaLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesionPos();
  if (!sesion) redirect("/pos/login");

  return (
    <div className="flex min-h-dvh bg-fondo">
      <PosSidebar sesion={sesion} />
      <div className="flex-1 lg:pl-60 flex flex-col">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
