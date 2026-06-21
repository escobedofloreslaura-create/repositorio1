import { prisma } from "./prisma";

export async function registrarAuditoria({
  usuarioId,
  accion,
  recursoTipo,
  recursoId,
  descripcion,
  ipOrigen,
}: {
  usuarioId?: string;
  accion: string;
  recursoTipo: string;
  recursoId?: string;
  descripcion: string;
  ipOrigen?: string;
}) {
  try {
    await prisma.registroAuditoria.create({
      data: { usuarioId, accion, recursoTipo, recursoId, descripcion, ipOrigen },
    });
  } catch {
    // No bloqueamos la operación principal si la auditoría falla
    console.error("Error al registrar auditoría");
  }
}

export async function registrarHistorial({
  clienteId,
  usuarioId,
  tipo,
  descripcion,
  metadatos,
}: {
  clienteId: string;
  usuarioId?: string;
  tipo: string;
  descripcion: string;
  metadatos?: Record<string, unknown>;
}) {
  try {
    await prisma.historialAccion.create({
      data: {
        clienteId,
        usuarioId,
        tipo,
        descripcion,
        metadatos: metadatos ? JSON.stringify(metadatos) : undefined,
      },
    });
  } catch {
    console.error("Error al registrar historial");
  }
}
