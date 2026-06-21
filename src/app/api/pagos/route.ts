import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";
import { registrarHistorial } from "@/lib/auditoria";

export async function GET(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get("clienteId");
    const estatus = searchParams.get("estatus");
    const mes = searchParams.get("mes"); // YYYY-MM

    const where: Record<string, unknown> = { eliminadoEn: null };

    if (clienteId) {
      where.clienteId = clienteId;
    } else if (sesion.rol === "VENDEDOR") {
      where.cliente = { vendedorId: sesion.id, eliminadoEn: null };
    }

    if (estatus) where.estatus = estatus;

    if (mes) {
      const [anio, month] = mes.split("-").map(Number);
      const inicio = new Date(anio, month - 1, 1);
      const fin = new Date(anio, month, 0, 23, 59, 59, 999);
      where.fechaPago = { gte: inicio, lte: fin };
    }

    const pagos = await prisma.pago.findMany({
      where,
      orderBy: { fechaPago: "desc" },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
      },
    });

    return NextResponse.json({ ok: true, data: pagos });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener pagos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    if (sesion.rol === "LECTURA") return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });

    const body = await req.json();
    const { clienteId, monto, montoTotal, metodo, estatus, fechaPago, fechaVencimiento, concepto, notas } = body;

    if (!clienteId || !monto || !concepto) {
      return NextResponse.json({ ok: false, error: "clienteId, monto y concepto son requeridos" }, { status: 400 });
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        eliminadoEn: null,
        ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}),
      },
    });

    if (!cliente) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });

    const pago = await prisma.$transaction(async (tx) => {
      const contador = await tx.contadorFolio.upsert({
        where: { id: "pagos" },
        create: { id: "pagos", ultimo: 1 },
        update: { ultimo: { increment: 1 } },
      });

      return tx.pago.create({
        data: {
          clienteId,
          monto: parseFloat(String(monto)),
          montoTotal: montoTotal ? parseFloat(String(montoTotal)) : null,
          metodo: metodo ?? "TRANSFERENCIA",
          estatus: estatus ?? "PAGADO",
          fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
          fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
          concepto,
          folio: contador.ultimo,
          notas: notas ?? null,
        },
      });
    });

    await registrarHistorial({
      clienteId,
      usuarioId: sesion.id,
      tipo: "PAGO_REGISTRADO",
      descripcion: `Pago registrado: ${pago.folio} - $${monto} - ${concepto}`,
      metadatos: { pagoId: pago.id, monto, folio: pago.folio },
    });

    return NextResponse.json({ ok: true, data: pago }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al crear pago" }, { status: 500 });
  }
}
