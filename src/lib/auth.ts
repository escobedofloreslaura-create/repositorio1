import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { cache } from "react";

export interface SesionUsuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  avatarUrl?: string | null;
  temaPreferido: string;
  vistaCompacta: boolean;
  onboardingCompletado: boolean;
  paginaAgendaSlug?: string | null;
}

export const obtenerSesion = cache(async (): Promise<SesionUsuario | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("crm_session")?.value;
  if (!token) return null;

  const sesion = await prisma.sesionToken.findUnique({
    where: { token },
    include: { usuario: true },
  });

  if (!sesion || sesion.expiraEn < new Date()) {
    return null;
  }

  const u = sesion.usuario;
  if (!u.activo) return null;

  return {
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    rol: u.rol,
    avatarUrl: u.avatarUrl,
    temaPreferido: u.temaPreferido,
    vistaCompacta: u.vistaCompacta,
    onboardingCompletado: u.onboardingCompletado,
    paginaAgendaSlug: u.paginaAgendaSlug,
  };
});

export async function requerirSesion(): Promise<SesionUsuario> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new Error("NO_AUTORIZADO");
  return sesion;
}

export async function requerirAdmin(): Promise<SesionUsuario> {
  const sesion = await requerirSesion();
  if (sesion.rol !== "ADMIN") throw new Error("SOLO_ADMIN");
  return sesion;
}

export function puede(
  usuario: SesionUsuario,
  accion: string,
  recurso?: { vendedorId?: string | null }
): boolean {
  if (usuario.rol === "ADMIN") return true;
  if (usuario.rol === "LECTURA" && accion !== "leer") return false;
  if (recurso && recurso.vendedorId && recurso.vendedorId !== usuario.id)
    return false;
  return true;
}

export async function crearSesion(usuarioId: string): Promise<string> {
  const token = crypto.randomUUID() + "-" + crypto.randomUUID();
  const expiraEn = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

  await prisma.sesionToken.create({
    data: { usuarioId, token, expiraEn },
  });

  return token;
}

export async function cerrarSesion(token: string): Promise<void> {
  await prisma.sesionToken.deleteMany({ where: { token } });
}

export async function hashearContrasena(contrasena: string): Promise<string> {
  return bcrypt.hash(contrasena, 12);
}

export async function verificarContrasena(
  contrasena: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(contrasena, hash);
}
