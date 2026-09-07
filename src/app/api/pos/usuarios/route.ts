import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirAdminPos, esAdminGeneral, hashearContrasenaPos, LIMITE_ADMINISTRADORES, LIMITE_CAJEROS } from "@/lib/pos/auth";
import { LIMITE_ADMIN_GENERAL } from "@/lib/pos/constantes";
import { respuestaError } from "@/lib/pos/api-utils";

// El Administrador General ve y gestiona usuarios de cualquier sucursal; un
// administrador de tienda solo ve y gestiona los de la suya.
export async function GET() {
  try {
    const sesion = await requerirAdminPos();
    const usuarios = await prisma.posUsuario.findMany({
      where: esAdminGeneral(sesion) ? {} : { sucursalId: sesion.sucursalId },
      select: { id: true, nombre: true, usuario: true, rol: true, sucursalId: true, activo: true, creadoEn: true, sucursal: { select: { nombre: true } } },
      orderBy: [{ rol: "asc" }, { nombre: "asc" }],
    });
    return NextResponse.json({ ok: true, data: usuarios });
  } catch (e) {
    return respuestaError(e, "Error al obtener usuarios");
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await requerirAdminPos();
    const { nombre, usuario, contrasena, rol, sucursalId } = await req.json();

    if (!nombre || !usuario || !contrasena) {
      return NextResponse.json({ ok: false, error: "Nombre, usuario y contraseña son requeridos" }, { status: 400 });
    }
    if (contrasena.length < 6) {
      return NextResponse.json({ ok: false, error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }
    const rolFinal = rol === "ADMINISTRADOR" ? "ADMINISTRADOR" : "CAJERO";

    let sucursalFinal: string | null;
    if (esAdminGeneral(sesion)) {
      sucursalFinal = sucursalId ?? null; // null = crear otro Administrador General
      if (sucursalFinal) {
        const sucursal = await prisma.posSucursal.findUnique({ where: { id: sucursalFinal } });
        if (!sucursal) return NextResponse.json({ ok: false, error: "Sucursal no encontrada" }, { status: 404 });
      }
    } else {
      // Un administrador de tienda solo puede crear usuarios de SU sucursal.
      sucursalFinal = sesion.sucursalId;
    }

    if (sucursalFinal === null) {
      if (rolFinal !== "ADMINISTRADOR") {
        return NextResponse.json({ ok: false, error: "Un usuario sin sucursal debe ser Administrador General" }, { status: 400 });
      }
      const activos = await prisma.posUsuario.count({ where: { rol: "ADMINISTRADOR", sucursalId: null, activo: true } });
      if (activos >= LIMITE_ADMIN_GENERAL) {
        return NextResponse.json({ ok: false, error: `Ya existe el máximo de ${LIMITE_ADMIN_GENERAL} administradores generales activos` }, { status: 409 });
      }
    } else {
      const activos = await prisma.posUsuario.count({ where: { rol: rolFinal, sucursalId: sucursalFinal, activo: true } });
      const limite = rolFinal === "ADMINISTRADOR" ? LIMITE_ADMINISTRADORES : LIMITE_CAJEROS;
      if (activos >= limite) {
        return NextResponse.json(
          { ok: false, error: `Ya existe el máximo de ${limite} ${rolFinal === "ADMINISTRADOR" ? "administradores" : "cajeros"} activos en esa sucursal` },
          { status: 409 }
        );
      }
    }

    const posUsuario = await prisma.posUsuario.create({
      data: {
        nombre,
        usuario: usuario.toLowerCase().trim(),
        contrasenaHash: await hashearContrasenaPos(contrasena),
        rol: rolFinal,
        sucursalId: sucursalFinal,
      },
      select: { id: true, nombre: true, usuario: true, rol: true, sucursalId: true, activo: true, creadoEn: true },
    });

    return NextResponse.json({ ok: true, data: posUsuario });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return NextResponse.json({ ok: false, error: "Ese nombre de usuario ya existe" }, { status: 409 });
    }
    return respuestaError(e, "Error al crear usuario");
  }
}
