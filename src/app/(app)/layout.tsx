import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { NavbarMovil } from "@/components/layout/navbar-movil";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");

  return (
    <div className="flex min-h-dvh bg-fondo">
      <Sidebar sesion={sesion} />
      <div className="flex-1 lg:pl-64 flex flex-col">
        <main className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <NavbarMovil />
    </div>
  );
}
