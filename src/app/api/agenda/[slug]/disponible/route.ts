import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const HORA_INICIO = 10;
const HORA_FIN = 18;
const DURACION_MINUTOS = 45;

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const vendedor = await prisma.usuario.findFirst({
      where: { paginaAgendaSlug: slug, activo: true, paginaAgendaActiva: true },
      select: { id: true, nombre: true },
    });

    if (!vendedor) {
      return NextResponse.json({ ok: false, error: "Agenda no disponible" }, { status: 404 });
    }

    const ahora = new Date();

    const inicio7d = new Date(ahora);
    inicio7d.setHours(0, 0, 0, 0);
    const fin7d = new Date(ahora);
    fin7d.setDate(fin7d.getDate() + 7);
    fin7d.setHours(23, 59, 59, 999);

    const citasExistentes = await prisma.cita.findMany({
      where: {
        vendedorId: vendedor.id,
        eliminadoEn: null,
        estado: { not: "CANCELADA" },
        fecha: { gte: inicio7d, lte: fin7d },
      },
      select: { fecha: true, duracionMinutos: true },
    });

    const slots: Array<{ fecha: string; disponible: boolean }> = [];

    for (let dia = 0; dia < 7; dia++) {
      const fechaDia = new Date(ahora);
      fechaDia.setDate(fechaDia.getDate() + dia);
      fechaDia.setHours(0, 0, 0, 0);

      // Skip weekends
      const diaSemana = fechaDia.getDay();
      if (diaSemana === 0 || diaSemana === 6) continue;

      let minutos = HORA_INICIO * 60;
      while (minutos + DURACION_MINUTOS <= HORA_FIN * 60) {
        const slotInicio = new Date(fechaDia);
        slotInicio.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0);
        const slotFin = new Date(slotInicio.getTime() + DURACION_MINUTOS * 60000);

        // Only include future slots
        if (slotInicio > ahora) {
          const tieneConflicto = citasExistentes.some((cita) => {
            const citaInicio = new Date(cita.fecha);
            const citaFin = new Date(citaInicio.getTime() + cita.duracionMinutos * 60000);
            return slotInicio < citaFin && slotFin > citaInicio;
          });

          slots.push({
            fecha: slotInicio.toISOString(),
            disponible: !tieneConflicto,
          });
        }

        minutos += DURACION_MINUTOS;
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        vendedor: { nombre: vendedor.nombre },
        slots,
        duracionMinutos: DURACION_MINUTOS,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener disponibilidad" }, { status: 500 });
  }
}
