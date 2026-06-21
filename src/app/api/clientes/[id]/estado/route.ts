import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";
import { registrarHistorial } from "@/lib/auditoria";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const { id } = await params;
    const { estado, motivoPerdida, notas } = await req.json();

    if (!estado) return NextResponse.json({ ok: false, error: "Estado requerido" }, { status: 400 });

    const estadosValidos = ["ACTIVO", "GANADO", "PERDIDO", "ARCHIVADO", "PROSPECTO"];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
    }

    if (estado === "PERDIDO" && !motivoPerdida) {
      return NextResponse.json({ ok: false, error: "Motivo de pérdida requerido" }, { status: 400 });
    }

    const existente = await prisma.cliente.findFirst({
      where: {
        id,
        eliminadoEn: null,
        ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}),
      },
    });

    if (!existente) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });

    const updateData: Record<string, unknown> = { estado, ultimoContactoEn: new Date() };

    if (estado === "PERDIDO") {
      updateData.motivoPerdida = motivoPerdida;
      updateData.estadoAnterior = existente.estado;
      updateData.etapaAnterior = existente.etapa;
    }

    if (estado === "ARCHIVADO") {
      updateData.estadoAnterior = existente.estado;
      updateData.etapaAnterior = existente.etapa;
    }

    const cliente = await prisma.cliente.update({ where: { id }, data: updateData });

    const descripcionMap: Record<string, string> = {
      GANADO: "Cliente marcado como GANADO",
      PERDIDO: `Cliente marcado como PERDIDO. Motivo: ${motivoPerdida}`,
      ARCHIVADO: "Cliente archivado",
      ACTIVO: "Cliente reactivado",
      PROSPECTO: "Cliente marcado como prospecto",
    };

    await registrarHistorial({
      clienteId: id,
      usuarioId: sesion.id,
      tipo: "CAMBIO_ESTADO",
      descripcion: descripcionMap[estado] ?? `Estado cambiado a ${estado}`,
      metadatos: {
        estadoAnterior: existente.estado,
        estadoNuevo: estado,
        motivoPerdida: motivoPerdida ?? null,
        notas: notas ?? null,
      },
    });

    return NextResponse.json({ ok: true, data: cliente });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al cambiar estado" }, { status: 500 });
  }
}
