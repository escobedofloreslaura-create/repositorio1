import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol !== "ADMIN") return NextResponse.json({ ok: false, error: "Solo administradores pueden exportar" }, { status: 403 });

    const [clientes, citas, pagos, usuarios, etiquetas, plantillas, historial, recordatorios] = await Promise.all([
      prisma.cliente.findMany({
        where: { eliminadoEn: null },
        include: { etiquetasCliente: { include: { etiqueta: true } } },
      }),
      prisma.cita.findMany({ where: { eliminadoEn: null } }),
      prisma.pago.findMany({ where: { eliminadoEn: null } }),
      prisma.usuario.findMany({
        select: {
          id: true,
          nombre: true,
          correo: true,
          rol: true,
          activo: true,
          avatarUrl: true,
          metaMensual: true,
          comision: true,
          paginaAgendaActiva: true,
          paginaAgendaSlug: true,
          // Explicitly exclude contrasenaHash
        },
      }),
      prisma.etiqueta.findMany(),
      prisma.plantillaMensaje.findMany(),
      prisma.historialAccion.findMany({ orderBy: { fecha: "desc" }, take: 5000 }),
      prisma.recordatorio.findMany(),
    ]);

    const exportData = {
      exportadoEn: new Date().toISOString(),
      exportadoPor: { id: sesion.id, nombre: sesion.nombre },
      version: "1.0",
      clientes,
      citas,
      pagos,
      usuarios,
      etiquetas,
      plantillas,
      historial,
      recordatorios,
    };

    await registrarAuditoria({
      usuarioId: sesion.id,
      accion: "EXPORTAR",
      recursoTipo: "sistema",
      descripcion: `Exportación completa de datos por ${sesion.nombre}`,
      ipOrigen: req.headers.get("x-forwarded-for") ?? undefined,
    });

    const json = JSON.stringify(exportData, null, 2);
    const fechaStr = new Date().toISOString().slice(0, 10);

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="lef-patrimonial-export-${fechaStr}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al exportar datos" }, { status: 500 });
  }
}
