import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";
import { registrarHistorial } from "@/lib/auditoria";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { id } = await params;

    const archivo = await prisma.archivo.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, vendedorId: true } },
      },
    });

    if (!archivo) return NextResponse.json({ ok: false, error: "Archivo no encontrado" }, { status: 404 });

    if (sesion.rol === "VENDEDOR" && archivo.cliente.vendedorId !== sesion.id) {
      return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });
    }

    if (archivo.urlExterna) {
      return NextResponse.redirect(archivo.urlExterna);
    }

    if (!archivo.datos) {
      return NextResponse.json({ ok: false, error: "Archivo sin contenido" }, { status: 404 });
    }

    const nombreSeguro = encodeURIComponent(archivo.nombre);

    return new NextResponse(archivo.datos, {
      headers: {
        "Content-Type": archivo.tipo,
        "Content-Disposition": `attachment; filename="${nombreSeguro}"; filename*=UTF-8''${nombreSeguro}`,
        "Content-Length": String(archivo.tamanio),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al descargar archivo" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const { id } = await params;

    const archivo = await prisma.archivo.findUnique({
      where: { id },
      include: { cliente: { select: { id: true, vendedorId: true } } },
    });

    if (!archivo) return NextResponse.json({ ok: false, error: "Archivo no encontrado" }, { status: 404 });

    if (sesion.rol === "VENDEDOR" && archivo.cliente.vendedorId !== sesion.id) {
      return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });
    }

    await prisma.archivo.delete({ where: { id } });

    await registrarHistorial({
      clienteId: archivo.clienteId,
      usuarioId: sesion.id,
      tipo: "ARCHIVO_ELIMINADO",
      descripcion: `Archivo eliminado: ${archivo.nombre}`,
      metadatos: { archivoId: id, nombre: archivo.nombre },
    });

    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al eliminar archivo" }, { status: 500 });
  }
}
