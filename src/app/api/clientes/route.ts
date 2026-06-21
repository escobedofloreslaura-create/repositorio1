import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";
import { registrarHistorial } from "@/lib/auditoria";

export async function GET(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const pagina = parseInt(searchParams.get("pagina") ?? "1");
    const take = parseInt(searchParams.get("take") ?? "50");
    const skip = (pagina - 1) * take;
    const estado = searchParams.get("estado");
    const etapa = searchParams.get("etapa");
    const temperatura = searchParams.get("temperatura");
    const busqueda = searchParams.get("busqueda") ?? searchParams.get("q");
    const etiquetaId = searchParams.get("etiquetaId");
    const proximaAccionVencida = searchParams.get("proximaAccionVencida");
    const vendedorIdParam = searchParams.get("vendedorId");

    const where: Record<string, unknown> = { eliminadoEn: null };

    if (sesion.rol === "VENDEDOR") {
      where.vendedorId = sesion.id;
    } else if (vendedorIdParam) {
      where.vendedorId = vendedorIdParam;
    }

    if (estado) where.estado = estado;
    if (etapa) where.etapa = etapa;
    if (temperatura) where.temperatura = temperatura;

    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda } },
        { telefono: { contains: busqueda } },
        { correo: { contains: busqueda } },
        { empresaNombre: { contains: busqueda } },
      ];
    }

    if (etiquetaId) {
      where.etiquetasCliente = { some: { etiquetaId } };
    }

    if (proximaAccionVencida === "true") {
      where.proximaAccionFecha = { lt: new Date() };
      where.proximaAccion = { not: null };
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip,
        take,
        orderBy: { ultimoContactoEn: "desc" },
        include: {
          vendedor: { select: { id: true, nombre: true, avatarUrl: true } },
          etiquetasCliente: { include: { etiqueta: true } },
          _count: { select: { citas: true, pagos: true } },
        },
      }),
      prisma.cliente.count({ where }),
    ]);

    return NextResponse.json({ ok: true, data: clientes, total });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al obtener clientes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const body = await req.json();
    const { nombre, telefono, correo, origen, etapa, vendedorId, ...resto } = body;

    if (!nombre || !telefono) {
      return NextResponse.json({ ok: false, error: "Nombre y teléfono son requeridos" }, { status: 400 });
    }

    // Duplicate check
    const duplicado = await prisma.cliente.findFirst({
      where: {
        eliminadoEn: null,
        OR: [
          { telefono },
          ...(correo ? [{ correo }] : []),
        ],
      },
    });

    if (duplicado) {
      return NextResponse.json({ ok: false, error: "Ya existe un cliente con ese teléfono o correo" }, { status: 409 });
    }

    const assignedVendedor = sesion.rol === "VENDEDOR" ? sesion.id : (vendedorId ?? sesion.id);

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        telefono,
        correo: correo ?? null,
        origen: origen ?? "DIRECTO",
        etapa: etapa ?? "PROSPECTO",
        vendedorId: assignedVendedor,
        ultimoContactoEn: new Date(),
        ...resto,
      },
    });

    await registrarHistorial({
      clienteId: cliente.id,
      usuarioId: sesion.id,
      tipo: "CREACION",
      descripcion: `Cliente creado: ${nombre}`,
    });

    return NextResponse.json({ ok: true, data: cliente }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al crear cliente" }, { status: 500 });
  }
}
