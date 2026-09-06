import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cache } from "react";

export const POS_COOKIE = "pos_session";
export const LIMITE_ADMINISTRADORES = 2;
export const LIMITE_CAJEROS = 5;

export interface SesionPos {
  id: string;
  nombre: string;
  usuario: string;
  rol: "ADMINISTRADOR" | "CAJERO";
}

export const obtenerSesionPos = cache(async (): Promise<SesionPos | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(POS_COOKIE)?.value;
  if (!token) return null;

  const sesion = await prisma.posSesionToken.findUnique({
    where: { token },
    include: { usuario: true },
  });

  if (!sesion || sesion.expiraEn < new Date()) return null;

  const u = sesion.usuario;
  if (!u.activo) return null;

  return {
    id: u.id,
    nombre: u.nombre,
    usuario: u.usuario,
    rol: u.rol as "ADMINISTRADOR" | "CAJERO",
  };
});

export async function requerirSesionPos(): Promise<SesionPos> {
  const sesion = await obtenerSesionPos();
  if (!sesion) throw new Error("NO_AUTORIZADO");
  return sesion;
}

export async function requerirAdminPos(): Promise<SesionPos> {
  const sesion = await requerirSesionPos();
  if (sesion.rol !== "ADMINISTRADOR") throw new Error("SOLO_ADMIN");
  return sesion;
}

export async function crearSesionPos(usuarioId: string): Promise<string> {
  const token = crypto.randomUUID() + "-" + crypto.randomUUID();
  const expiraEn = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.posSesionToken.create({ data: { usuarioId, token, expiraEn } });

  return token;
}

export async function cerrarSesionPos(token: string): Promise<void> {
  await prisma.posSesionToken.deleteMany({ where: { token } });
}

export async function hashearContrasenaPos(contrasena: string): Promise<string> {
  return bcrypt.hash(contrasena, 12);
}

export async function verificarContrasenaPos(
  contrasena: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(contrasena, hash);
}
