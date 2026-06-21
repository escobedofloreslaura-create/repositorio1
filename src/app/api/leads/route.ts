import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { nombre, telefono, correo, origen, canalUtm, vendedorSlug } = await req.json();

    if (!nombre || !telefono) {
      return NextResponse.json({ ok: false, error: "Nombre y teléfono son requeridos" }, { status: 400 });
    }

    // Find vendor by agenda slug
    let vendedorId: string | null = null;
    if (vendedorSlug) {
      const vendedor = await prisma.usuario.findFirst({
        where: { paginaAgendaSlug: vendedorSlug, activo: true, paginaAgendaActiva: true },
        select: { id: true },
      });
      vendedorId = vendedor?.id ?? null;
    }

    // If no vendor found by slug, assign first active admin/vendedor
    if (!vendedorId) {
      const fallback = await prisma.usuario.findFirst({
        where: { activo: true, rol: { in: ["ADMIN", "VENDEDOR"] } },
        select: { id: true },
        orderBy: { id: "asc" },
      });
      vendedorId = fallback?.id ?? null;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check for existing client
      let cliente = await tx.cliente.findFirst({
        where: { telefono, eliminadoEn: null },
      });

      if (!cliente) {
        cliente = await tx.cliente.create({
          data: {
            nombre,
            telefono,
            correo: correo ?? null,
            origen: origen ?? "LANDING",
            canalUtm: canalUtm ?? null,
            etapa: "PROSPECTO",
            estado: "ACTIVO",
            vendedorId,
            ultimoContactoEn: new Date(),
          },
        });
      }

      const leadLanding = await tx.leadLanding.create({
        data: {
          nombre,
          telefono,
          correo: correo ?? null,
          origen: origen ?? "LANDING",
          canalUtm: canalUtm ?? null,
          vendedorSlug: vendedorSlug ?? null,
          procesado: true,
          clienteId: cliente.id,
        },
      });

      return { cliente, leadLanding };
    });

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al procesar lead" }, { status: 500 });
  }
}
