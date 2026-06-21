import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { nombre, telefono, correo, fecha, notas } = await req.json();

    if (!nombre || !telefono || !fecha) {
      return NextResponse.json({ ok: false, error: "Nombre, teléfono y fecha son requeridos" }, { status: 400 });
    }

    const vendedor = await prisma.usuario.findFirst({
      where: { paginaAgendaSlug: slug, activo: true, paginaAgendaActiva: true },
      select: { id: true, nombre: true },
    });

    if (!vendedor) {
      return NextResponse.json({ ok: false, error: "Agenda no disponible" }, { status: 404 });
    }

    const fechaCita = new Date(fecha);
    const hora = fechaCita.getHours();

    if (hora < 10 || hora >= 18) {
      return NextResponse.json({ ok: false, error: "Horario no disponible" }, { status: 400 });
    }

    // Check slot availability
    const duracionMinutos = 45;
    const slotFin = new Date(fechaCita.getTime() + duracionMinutos * 60000);

    const conflicto = await prisma.cita.findFirst({
      where: {
        vendedorId: vendedor.id,
        eliminadoEn: null,
        estado: { not: "CANCELADA" },
        AND: [{ fecha: { lt: slotFin } }, { fecha: { gte: new Date(fechaCita.getTime() - duracionMinutos * 60000) } }],
      },
    });

    if (conflicto) {
      return NextResponse.json({ ok: false, error: "Ese horario ya no está disponible" }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find or create client
      let cliente = await tx.cliente.findFirst({
        where: { telefono, eliminadoEn: null },
      });

      if (!cliente) {
        cliente = await tx.cliente.create({
          data: {
            nombre,
            telefono,
            correo: correo ?? null,
            origen: "AGENDA",
            etapa: "PROSPECTO",
            estado: "ACTIVO",
            vendedorId: vendedor.id,
            ultimoContactoEn: new Date(),
          },
        });
      }

      const cita = await tx.cita.create({
        data: {
          clienteId: cliente.id,
          vendedorId: vendedor.id,
          fecha: fechaCita,
          duracionMinutos,
          tipo: "REUNION",
          estado: "PROGRAMADA",
          notas: notas ?? null,
          nombreProspecto: nombre,
          telefonoProspecto: telefono,
          correoProspecto: correo ?? null,
          origenAgenda: slug,
        },
      });

      const lead = await tx.leadLanding.create({
        data: {
          nombre,
          telefono,
          correo: correo ?? null,
          origen: "AGENDA",
          canalUtm: null,
          vendedorSlug: slug,
          procesado: true,
          clienteId: cliente.id,
        },
      });

      await tx.historialAccion.create({
        data: {
          clienteId: cliente.id,
          usuarioId: vendedor.id,
          tipo: "CITA_AGENDADA",
          descripcion: `Cita agendada desde agenda pública para ${fechaCita.toLocaleDateString("es-MX")}`,
          metadatos: JSON.stringify({ citaId: cita.id, origenAgenda: slug }),
        },
      });

      return { cita, cliente, lead };
    });

    return NextResponse.json({
      ok: true,
      data: {
        citaId: result.cita.id,
        fecha: result.cita.fecha,
        vendedor: { nombre: vendedor.nombre },
        cliente: { id: result.cliente.id, nombre: result.cliente.nombre },
      },
    }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al agendar cita" }, { status: 500 });
  }
}
