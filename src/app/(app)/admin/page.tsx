import { obtenerSesion } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { redirect } from "next/navigation";

export const metadata = { title: "Administración" };

export default async function AdminPage() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;
  if (sesion.rol !== "ADMIN") redirect("/dashboard");

  const [usuarios, auditoria] = await Promise.all([
    prisma.usuario.findMany({
      where: {},
      select: { id: true, nombre: true, correo: true, rol: true, activo: true, creadoEn: true },
      orderBy: { creadoEn: "asc" },
    }),
    prisma.registroAuditoria.findMany({
      orderBy: { creadoEn: "desc" },
      take: 50,
      include: { usuario: { select: { nombre: true } } },
    }),
  ]);

  return (
    <div>
      <Header titulo="Administración" subtitulo="Usuarios, permisos y auditoría" sesion={sesion} />
      <div className="p-6">
        <AdminPanel usuarios={usuarios} auditoria={auditoria} sesion={sesion} />
      </div>
    </div>
  );
}
