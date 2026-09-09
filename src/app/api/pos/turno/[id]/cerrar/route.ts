import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requerirSesionPos, puedeOperarTurno } from "@/lib/pos/auth";
import { respuestaError } from "@/lib/pos/api-utils";

function sumaPorTipo(movimientos: { tipo: string; monto: number }[], tipo: string): number {
  return movimientos.filter((m) => m.tipo === tipo).reduce((acc, m) => acc + m.monto, 0);
}

// Corte de caja del día: resume entradas/salidas, ventas totales y la
// ganancia real, y queda guardado de forma permanente para consultarlo después.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesion = await requerirSesionPos();
    const { id } = await params;

    const corte = await prisma.$transaction(async (tx) => {
      const turno = await tx.posTurno.findUnique({ where: { id }, include: { movimientos: true } });
      if (!turno) throw new Error("NO_ENCONTRADA");
      if (turno.estado !== "ABIERTO") throw new Error("YA_CERRADO");
      if (!puedeOperarTurno(sesion, turno)) throw new Error("SIN_PERMISO");

      const ventas = await tx.posVenta.findMany({
        where: { turnoId: id, estado: "COMPLETADA" },
        include: { detalles: { include: { producto: { include: { departamento: true } } } } },
      });

      let ventasTotales = 0;
      let costoVentas = 0;
      const ventasPorDepartamentoMapa = new Map<string, number>();
      for (const venta of ventas) {
        for (const detalle of venta.detalles) {
          const cantidadNeta = detalle.cantidad - detalle.cantidadDevuelta;
          const subtotalNeto = cantidadNeta * detalle.precioUnitario;
          ventasTotales += subtotalNeto;
          costoVentas += cantidadNeta * detalle.costoUnitario;

          const nombreDepartamento = detalle.producto?.departamento.nombre ?? "Otros";
          ventasPorDepartamentoMapa.set(nombreDepartamento, (ventasPorDepartamentoMapa.get(nombreDepartamento) ?? 0) + subtotalNeto);
        }
      }
      const ventasPorDepartamento = Array.from(ventasPorDepartamentoMapa, ([departamento, total]) => ({ departamento, total })).sort(
        (a, b) => b.total - a.total
      );

      const movimientos = turno.movimientos;
      const totalEfectivo = sumaPorTipo(movimientos, "VENTA_EFECTIVO");
      const totalTarjeta = sumaPorTipo(movimientos, "VENTA_TARJETA");
      const totalTransferencia = sumaPorTipo(movimientos, "VENTA_TRANSFERENCIA");
      const totalCobroClientesEfectivo = sumaPorTipo(movimientos, "COBRO_CLIENTE_EFECTIVO");
      // "Cobro a Clientes" se reporta junto (efectivo + tarjeta + transferencia),
      // pero solo la parte en efectivo entra al efectivo esperado en caja.
      const totalCobroClientes =
        totalCobroClientesEfectivo +
        sumaPorTipo(movimientos, "COBRO_CLIENTE_TARJETA") +
        sumaPorTipo(movimientos, "COBRO_CLIENTE_TRANSFERENCIA");
      const totalPagoProveedores = sumaPorTipo(movimientos, "PAGO_PROVEEDOR");
      const totalSalidas = sumaPorTipo(movimientos, "SALIDA");
      const totalEntradasManuales = sumaPorTipo(movimientos, "ENTRADA_MANUAL");

      const efectivoEsperado =
        turno.fondoInicial +
        totalEfectivo +
        totalEntradasManuales +
        totalCobroClientesEfectivo -
        totalSalidas -
        totalPagoProveedores;

      const nuevoCorte = await tx.posCorteCaja.create({
        data: {
          turnoId: id,
          sucursalId: turno.sucursalId,
          fondoInicial: turno.fondoInicial,
          totalEfectivo,
          totalTarjeta,
          totalTransferencia,
          totalCobroClientes,
          totalPagoProveedores,
          totalSalidas,
          totalEntradasManuales,
          ventasTotales,
          costoVentas,
          gananciaReal: ventasTotales - costoVentas,
          efectivoEsperado,
          // Se atribuye al usuario dueño del turno (no a quien hace clic en
          // "Cerrar caja"), para que una caja reasignada a un cajero quede
          // registrada a su nombre aunque un administrador la cierre por él.
          usuarioId: turno.usuarioId,
        },
        include: { usuario: { select: { nombre: true } } },
      });

      await tx.posTurno.update({ where: { id }, data: { estado: "CERRADO", cerradoEn: new Date() } });

      return { ...nuevoCorte, ventasPorDepartamento };
    });

    // La ganancia (costo vs. venta) y el desglose por departamento son
    // información confidencial del negocio: solo los administradores la ven.
    // Un cajero solo ve el importe total de venta.
    if (sesion.rol !== "ADMINISTRADOR") {
      const { costoVentas: _costoVentas, gananciaReal: _gananciaReal, ventasPorDepartamento: _ventasPorDepartamento, ...resto } = corte;
      return NextResponse.json({ ok: true, data: resto });
    }

    return NextResponse.json({ ok: true, data: corte });
  } catch (e) {
    if (e instanceof Error && e.message === "NO_ENCONTRADA") {
      return NextResponse.json({ ok: false, error: "Turno no encontrado" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "YA_CERRADO") {
      return NextResponse.json({ ok: false, error: "Este turno ya fue cerrado" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "SIN_PERMISO") {
      return NextResponse.json({ ok: false, error: "No puedes cerrar la caja de otro cajero" }, { status: 403 });
    }
    return respuestaError(e, "Error al generar el corte de caja");
  }
}
