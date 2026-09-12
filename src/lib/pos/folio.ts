import type { Prisma } from "@/generated/prisma/client";

export async function siguienteFolioVenta(tx: Prisma.TransactionClient, sucursalId: string): Promise<number> {
  const contador = await tx.posContadorFolio.upsert({
    where: { sucursalId },
    update: { ultimo: { increment: 1 } },
    create: { sucursalId, ultimo: 1 },
  });
  return contador.ultimo;
}
