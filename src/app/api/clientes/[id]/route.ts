import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";
import { registrarHistorial } from "@/lib/auditoria";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { id } = await params;

    const cliente = await prisma.cliente.findFirst({
      where: {
        id,
        eliminadoEn: null,
        ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}),
      },
      include: {
        vendedor: { select: { id: true, nombre: true, avatarUrl: true, correo: true } },
        citas: { where: { eliminadoEn: null }, orderBy: { fecha: "desc" } },
        pagos: { where: { eliminadoEn: null }, orderBy: { fechaPago: "desc" } },
        historial: { orderBy: { fecha: "desc" }, take: 50, include: { usuario: { select: { id: true, nombre: true, avatarUrl: true } } } },
        archivos: { orderBy: { id: "desc" }, select: { id: true, nombre: true, etiqueta: true, tipo: true, tamanio: true, urlExterna: true } },
        etiquetasCliente: { include: { etiqueta: true } },
      },
    });

    if (!cliente) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });

    return NextResponse.json({ ok: true, data: cliente });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener cliente" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    if (body.restaurar) {
      const eliminado = await prisma.cliente.findFirst({
        where: { id, ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}) },
      });
      if (!eliminado) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
      await prisma.cliente.update({ where: { id }, data: { eliminadoEn: null } });
      return NextResponse.json({ ok: true, data: { id } });
    }

    const existente = await prisma.cliente.findFirst({
      where: {
        id,
        eliminadoEn: null,
        ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}),
      },
    });

    if (!existente) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });

    const { etapa, estado, ...resto } = body;

    const etapaCambio = etapa && etapa !== existente.etapa;
    const estadoCambio = estado && estado !== existente.estado;

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        ...resto,
        ...(etapa ? { etapa } : {}),
        ...(estado ? { estado } : {}),
        ultimoContactoEn: new Date(),
      },
    });

    if (etapaCambio) {
      await registrarHistorial({
        clienteId: id,
        usuarioId: sesion.id,
        tipo: "CAMBIO_ETAPA",
        descripcion: `Etapa: ${existente.etapa} → ${etapa}`,
        metadatos: { etapaAnterior: existente.etapa, etapaNueva: etapa },
      });
    }

    if (estadoCambio) {
      await registrarHistorial({
        clienteId: id,
        usuarioId: sesion.id,
        tipo: "CAMBIO_ESTADO",
        descripcion: `Estado: ${existente.estado} → ${estado}`,
        metadatos: { estadoAnterior: existente.estado, estadoNuevo: estado },
      });
    }

    return NextResponse.json({ ok: true, data: cliente });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al actualizar cliente" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const { id } = await params;

    const existente = await prisma.cliente.findFirst({
      where: {
        id,
        eliminadoEn: null,
        ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}),
      },
    });

    if (!existente) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });

    await prisma.cliente.update({ where: { id }, data: { eliminadoEn: new Date() } });

    await registrarHistorial({
      clienteId: id,
      usuarioId: sesion.id,
      tipo: "ELIMINACION",
      descripcion: `Cliente eliminado: ${existente.nombre}`,
    });

    return NextResponse.json({ ok: true, data: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al eliminar cliente" }, { status: 500 });
  }
}
