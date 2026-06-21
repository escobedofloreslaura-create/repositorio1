import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";
import { registrarHistorial } from "@/lib/auditoria";

export async function GET(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get("fecha");
    const vendedorIdParam = searchParams.get("vendedorId");
    const clienteId = searchParams.get("clienteId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = parseInt(searchParams.get("pageSize") ?? "50");

    const where: Record<string, unknown> = { eliminadoEn: null };

    if (sesion.rol === "VENDEDOR") {
      where.vendedorId = sesion.id;
    } else if (vendedorIdParam) {
      where.vendedorId = vendedorIdParam;
    }

    if (clienteId) where.clienteId = clienteId;

    if (fecha) {
      const inicio = new Date(fecha);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(23, 59, 59, 999);
      where.fecha = { gte: inicio, lte: fin };
    }

    const skip = (page - 1) * pageSize;

    const [citas, total] = await Promise.all([
      prisma.cita.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { fecha: "asc" },
        include: {
          cliente: { select: { id: true, nombre: true, telefono: true, correo: true } },
          vendedor: { select: { id: true, nombre: true, avatarUrl: true } },
        },
      }),
      prisma.cita.count({ where }),
    ]);

    return NextResponse.json({ ok: true, data: { citas, total, page, pageSize } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener citas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const body = await req.json();
    const { clienteId, fecha, duracionMinutos = 60, tipo = "LLAMADA", estado = "PROGRAMADA", notas, vendedorId, nombreProspecto, telefonoProspecto, correoProspecto } = body;

    if (!fecha) return NextResponse.json({ ok: false, error: "Fecha requerida" }, { status: 400 });

    const fechaCita = new Date(fecha);
    const hora = fechaCita.getHours();

    if (hora < 10 || hora >= 18) {
      return NextResponse.json({ ok: false, error: "Las citas deben ser entre 10:00 y 18:00" }, { status: 400 });
    }

    const assignedVendedor = sesion.rol === "VENDEDOR" ? sesion.id : (vendedorId ?? sesion.id);

    // Check overlap
    const finCita = new Date(fechaCita.getTime() + duracionMinutos * 60000);
    const overlap = await prisma.cita.findFirst({
      where: {
        eliminadoEn: null,
        vendedorId: assignedVendedor,
        estado: { not: "CANCELADA" },
        AND: [
          { fecha: { lt: finCita } },
          {
            fecha: {
              gte: new Date(fechaCita.getTime() - 60 * 60000),
            },
          },
        ],
      },
    });

    if (overlap) {
      return NextResponse.json({ ok: false, error: "El vendedor ya tiene una cita en ese horario" }, { status: 409 });
    }

    const cita = await prisma.cita.create({
      data: {
        clienteId: clienteId ?? null,
        vendedorId: assignedVendedor,
        fecha: fechaCita,
        duracionMinutos,
        tipo,
        estado,
        notas: notas ?? null,
        nombreProspecto: nombreProspecto ?? null,
        telefonoProspecto: telefonoProspecto ?? null,
        correoProspecto: correoProspecto ?? null,
      },
    });

    if (clienteId) {
      await registrarHistorial({
        clienteId,
        usuarioId: sesion.id,
        tipo: "CITA_AGENDADA",
        descripcion: `Cita agendada para ${fechaCita.toLocaleDateString("es-MX")} - ${tipo}`,
        metadatos: { citaId: cita.id, fecha: fechaCita.toISOString(), tipo },
      });
    }

    return NextResponse.json({ ok: true, data: cita }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al crear cita" }, { status: 500 });
  }
}
