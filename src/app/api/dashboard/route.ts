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
    const historico: Array<{ mes: string; ingresos: number; clientes: number; citas: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const mesDate = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const finMesHist = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const [ingresosHist, clientesHist, citasHist] = await Promise.all([
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
        prisma.cita.count({
          where: {
            eliminadoEn: null,
            ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : vendedorIdParam ? { vendedorId: vendedorIdParam } : {}),
            fecha: { gte: mesDate, lte: finMesHist },
            estado: { not: "CANCELADA" },
          },
        }),
      ]);

      historico.push({
        mes: mesDate.toISOString().slice(0, 7),
        ingresos: ingresosHist._sum.monto ?? 0,
        clientes: clientesHist,
        citas: citasHist,
      });
    }

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
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener métricas" }, { status: 500 });
  }
}
