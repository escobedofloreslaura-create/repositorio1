import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cache } from "react";

export const POS_COOKIE = "pos_session";
export const POS_SUCURSAL_COOKIE = "pos_sucursal_activa";
export const LIMITE_ADMINISTRADORES = 2;
export const LIMITE_CAJEROS = 5;

export interface SesionPos {
  id: string;
  nombre: string;
  usuario: string;
  rol: "ADMINISTRADOR" | "CAJERO";
  /** Sucursal fija del usuario. Nulo = Administrador General (sin tienda fija). */
  sucursalId: string | null;
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
    sucursalId: u.sucursalId,
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

/** Administrador General: sin sucursal fija, gestiona catálogo/precios/traspasos y puede operar cualquier tienda. */
export function esAdminGeneral(sesion: SesionPos): boolean {
  return sesion.rol === "ADMINISTRADOR" && sesion.sucursalId === null;
}

export async function requerirAdminGeneral(): Promise<SesionPos> {
  const sesion = await requerirAdminPos();
  if (sesion.sucursalId !== null) throw new Error("SOLO_ADMIN_GENERAL");
  return sesion;
}

/**
 * Puede este usuario operar (vender, hacer movimientos de caja, cerrar) el
 * turno indicado: el propio cajero, el Administrador General, o un
 * administrador de la MISMA sucursal que el turno. Un administrador de otra
 * tienda no cuenta, aunque tenga el rol ADMINISTRADOR.
 */
export function puedeOperarTurno(sesion: SesionPos, turno: { usuarioId: string; sucursalId: string }): boolean {
  if (turno.usuarioId === sesion.id) return true;
  if (esAdminGeneral(sesion)) return true;
  return sesion.rol === "ADMINISTRADOR" && sesion.sucursalId === turno.sucursalId;
}

/**
 * Sucursal en la que el usuario está operando en este momento. Para usuarios
 * de tienda es siempre la suya. Para el Administrador General es la que haya
 * elegido con el selector (cookie), o la primera sucursal activa si no ha
 * elegido ninguna todavía.
 */
export async function obtenerSucursalActiva(sesion: SesionPos): Promise<string | null> {
  if (sesion.sucursalId) return sesion.sucursalId;

  const cookieStore = await cookies();
  const elegida = cookieStore.get(POS_SUCURSAL_COOKIE)?.value;
  if (elegida) {
    const existe = await prisma.posSucursal.findUnique({ where: { id: elegida } });
    if (existe && existe.activa) return existe.id;
  }

  const primera = await prisma.posSucursal.findFirst({ where: { activa: true }, orderBy: { creadoEn: "asc" } });
  return primera?.id ?? null;
}

export async function requerirSucursalActiva(sesion: SesionPos): Promise<string> {
  const sucursalId = await obtenerSucursalActiva(sesion);
  if (!sucursalId) throw new Error("SIN_SUCURSAL");
  return sucursalId;
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
