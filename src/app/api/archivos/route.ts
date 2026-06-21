import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";
import { registrarHistorial } from "@/lib/auditoria";

const TIPOS_PERMITIDOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const formData = await req.formData();
    const archivo = formData.get("archivo") as File | null;
    const clienteId = formData.get("clienteId") as string | null;
    const etiqueta = formData.get("etiqueta") as string | null;

    if (!archivo) return NextResponse.json({ ok: false, error: "Archivo requerido" }, { status: 400 });
    if (!clienteId) return NextResponse.json({ ok: false, error: "clienteId requerido" }, { status: 400 });

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      return NextResponse.json(
        { ok: false, error: "Tipo de archivo no permitido. Solo PDF, JPG, PNG y WebP" },
        { status: 400 }
      );
    }

    if (archivo.size > TAMANO_MAXIMO) {
      return NextResponse.json({ ok: false, error: "Archivo demasiado grande. Máximo 10MB" }, { status: 400 });
    }

    // Verify client access
    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        eliminadoEn: null,
        ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}),
      },
    });

    if (!cliente) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });

    const arrayBuffer = await archivo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const archivoCreado = await prisma.archivo.create({
      data: {
        clienteId,
        subidoPorId: sesion.id,
        nombre: archivo.name,
        etiqueta: etiqueta ?? undefined,
        tipo: archivo.type,
        tamanio: archivo.size,
        datos: buffer,
        urlExterna: null,
      },
    });

    await registrarHistorial({
      clienteId,
      usuarioId: sesion.id,
      tipo: "ARCHIVO_SUBIDO",
      descripcion: `Archivo subido: ${archivo.name}`,
      metadatos: { archivoId: archivoCreado.id, nombre: archivo.name, tipo: archivo.type, tamanio: archivo.size },
    });

    // Return without datos (binary)
    const { datos: _datos, ...archivoSinDatos } = archivoCreado;

    return NextResponse.json({ ok: true, data: archivoSinDatos }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al subir archivo" }, { status: 500 });
  }
}
