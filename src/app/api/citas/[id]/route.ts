import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";
import { registrarHistorial } from "@/lib/auditoria";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { id } = await params;

    const cita = await prisma.cita.findFirst({
      where: {
        id,
        eliminadoEn: null,
        ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}),
      },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true, correo: true } },
        vendedor: { select: { id: true, nombre: true, avatarUrl: true } },
      },
    });

    if (!cita) return NextResponse.json({ ok: false, error: "Cita no encontrada" }, { status: 404 });

    return NextResponse.json({ ok: true, data: cita });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener cita" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();

    const existente = await prisma.cita.findFirst({
      where: {
        id,
        eliminadoEn: null,
        ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}),
      },
    });

    if (!existente) return NextResponse.json({ ok: false, error: "Cita no encontrada" }, { status: 404 });

    const { fecha, duracionMinutos, tipo, estado, notas, googleEventId, googleMeetUrl } = body;

    const cita = await prisma.cita.update({
      where: { id },
      data: {
        ...(fecha ? { fecha: new Date(fecha) } : {}),
        ...(duracionMinutos ? { duracionMinutos } : {}),
        ...(tipo ? { tipo } : {}),
        ...(estado ? { estado } : {}),
        ...(notas !== undefined ? { notas } : {}),
        ...(googleEventId !== undefined ? { googleEventId } : {}),
        ...(googleMeetUrl !== undefined ? { googleMeetUrl } : {}),
      },
    });

    if (existente.clienteId && estado && estado !== existente.estado) {
      await registrarHistorial({
        clienteId: existente.clienteId,
        usuarioId: sesion.id,
        tipo: "CITA_ACTUALIZADA",
        descripcion: `Cita actualizada: estado ${existente.estado} → ${estado}`,
        metadatos: { citaId: id },
      });
    }

    return NextResponse.json({ ok: true, data: cita });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al actualizar cita" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const { id } = await params;

    const existente = await prisma.cita.findFirst({
      where: {
        id,
        eliminadoEn: null,
        ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}),
      },
    });

    if (!existente) return NextResponse.json({ ok: false, error: "Cita no encontrada" }, { status: 404 });

    await prisma.cita.update({ where: { id }, data: { eliminadoEn: new Date() } });

    if (existente.clienteId) {
      await registrarHistorial({
        clienteId: existente.clienteId,
        usuarioId: sesion.id,
        tipo: "CITA_CANCELADA",
        descripcion: `Cita cancelada`,
        metadatos: { citaId: id, fecha: existente.fecha.toISOString() },
      });
    }

    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al eliminar cita" }, { status: 500 });
  }
}
