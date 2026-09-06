import type { Prisma } from "@/generated/prisma/client";

export async function siguienteFolioVenta(tx: Prisma.TransactionClient): Promise<number> {
  const contador = await tx.posContadorFolio.upsert({
    where: { id: "ventas" },
    update: { ultimo: { increment: 1 } },
    create: { id: "ventas", ultimo: 1 },
  });
  return contador.ultimo;
}
