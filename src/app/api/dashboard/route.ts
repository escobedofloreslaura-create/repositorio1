import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const vendedorIdParam = searchParams.get("vendedorId");

    const vendedorFilter =
      sesion.rol === "VENDEDOR"
        ? { vendedorId: sesion.id }
        : vendedorIdParam
        ? { vendedorId: vendedorIdParam }
        : {};

    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);

    const baseCliente = { eliminadoEn: null, ...vendedorFilter };

    const [
      nuevosInteresados,
      citasAgendadas,
      propuestasEnviadas,
      clientesGanados,
      pagosMes,
      pagosVencidos,
      todosClientes,
    ] = await Promise.all([
      // New leads this month
      prisma.cliente.count({
        where: { ...baseCliente, creadoEn: { gte: inicioMes, lte: finMes } },
      }),
      // Appointments scheduled this month
      prisma.cita.count({
        where: {
          eliminadoEn: null,
          ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : vendedorIdParam ? { vendedorId: vendedorIdParam } : {}),
          fecha: { gte: inicioMes, lte: finMes },
          estado: { not: "CANCELADA" },
        },
      }),
      // Proposals sent (clients in PROPUESTA stage)
      prisma.cliente.count({
        where: { ...baseCliente, etapa: "PROPUESTA", ultimoContactoEn: { gte: inicioMes } },
      }),
      // Won clients this month
      prisma.cliente.count({
        where: { ...baseCliente, estado: "GANADO", ultimoContactoEn: { gte: inicioMes, lte: finMes } },
      }),
      // Payments this month
      prisma.pago.findMany({
        where: {
          eliminadoEn: null,
          fechaPago: { gte: inicioMes, lte: finMes },
          ...(sesion.rol === "VENDEDOR"
            ? { cliente: { vendedorId: sesion.id, eliminadoEn: null } }
            : vendedorIdParam
            ? { cliente: { vendedorId: vendedorIdParam, eliminadoEn: null } }
            : {}),
        },
        select: { monto: true, estatus: true },
      }),
      // Overdue payments
      prisma.pago.count({
        where: {
          eliminadoEn: null,
          estatus: "PENDIENTE",
          fechaVencimiento: { lt: ahora },
          ...(sesion.rol === "VENDEDOR"
            ? { cliente: { vendedorId: sesion.id, eliminadoEn: null } }
            : vendedorIdParam
            ? { cliente: { vendedorId: vendedorIdParam, eliminadoEn: null } }
            : {}),
        },
      }),
      // All active clients for funnel value
      prisma.cliente.findMany({
        where: { ...baseCliente, estado: { in: ["ACTIVO", "PROSPECTO"] } },
        select: { valorEstimado: true, etapa: true, estado: true },
      }),
    ]);

    const ingresosCobrados = pagosMes
      .filter((p) => p.estatus === "PAGADO")
      .reduce((sum, p) => sum + p.monto, 0);

    const pagosPendientes = pagosMes
      .filter((p) => p.estatus === "PENDIENTE")
      .reduce((sum, p) => sum + p.monto, 0);

    const valorEmbudo = todosClientes.reduce((sum, c) => sum + (c.valorEstimado ?? 0), 0);

    const totalLeads = nuevosInteresados;
    const tasaCierre = totalLeads > 0 ? Math.round((clientesGanados / totalLeads) * 100) : 0;

    // Pronostico: funnel value * close rate
    const pronostico = Math.round(valorEmbudo * (tasaCierre / 100));

    // Historical 6 months
    const historico: Array<{ mes: string; ingresos: number; clientesGanados: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const mesDate = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const finMesHist = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const [ingresosHist, clientesHist] = await Promise.all([
        prisma.pago.aggregate({
          where: {
            eliminadoEn: null,
            estatus: "PAGADO",
            fechaPago: { gte: mesDate, lte: finMesHist },
            ...(sesion.rol === "VENDEDOR"
              ? { cliente: { vendedorId: sesion.id, eliminadoEn: null } }
              : vendedorIdParam
              ? { cliente: { vendedorId: vendedorIdParam, eliminadoEn: null } }
              : {}),
          },
          _sum: { monto: true },
        }),
        prisma.cliente.count({
          where: { ...baseCliente, estado: "GANADO", ultimoContactoEn: { gte: mesDate, lte: finMesHist } },
        }),
      ]);

      historico.push({
        mes: mesDate.toLocaleDateString("es-MX", { month: "short", year: "2-digit" }),
        ingresos: ingresosHist._sum.monto ?? 0,
        clientesGanados: clientesHist,
      });
    }

    // Origen de leads este mes
    const origenLeadsRaw = await prisma.cliente.groupBy({
      by: ["origen"],
      where: { ...baseCliente, creadoEn: { gte: inicioMes, lte: finMes } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
    const origenLeads = origenLeadsRaw.map((o) => ({ origen: o.origen, _count: { id: o._count.id } }));

    // Motivos de pérdida
    const motivosPerdidaRaw = await prisma.cliente.groupBy({
      by: ["motivoPerdida"],
      where: { ...baseCliente, estado: "PERDIDO" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
    const motivosPerdida = motivosPerdidaRaw.map((m) => ({ motivoPerdida: m.motivoPerdida, _count: { id: m._count.id } }));

    // Config del negocio para meta
    const config = await prisma.configNegocio.findFirst({ where: { id: "principal" } });
    const metaMensual = config?.metaMensualDinero ?? 100000;

    // Días restantes en el mes
    const diasRestantes = Math.ceil((finMes.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

    // Semáforo
    const porcentajeMeta = metaMensual > 0 ? (ingresosCobrados / metaMensual) * 100 : 0;
    const semaforo = porcentajeMeta >= 80 ? "verde" : porcentajeMeta >= 50 ? "amarillo" : "rojo";

    return NextResponse.json({
      ok: true,
      data: {
        nuevosInteresados,
        citasAgendadas,
        propuestasEnviadas,
        clientesGanados,
        ingresosCobrados,
        pagosPendientes,
        pagosVencidos,
        tasaCierre,
        valorEmbudo,
        pronostico,
        historico,
        origenLeads,
        motivosPerdida,
        metaMensual,
        diasRestantes,
        semaforo,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener métricas" }, { status: 500 });
  }
}
