-- CreateTable
CREATE TABLE "Comision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendedorId" TEXT NOT NULL,
    "clienteId" TEXT,
    "polizaId" TEXT,
    "aseguradora" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL,
    "notas" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Comision_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comision_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Comision_vendedorId_idx" ON "Comision"("vendedorId");

-- CreateIndex
CREATE INDEX "Comision_clienteId_idx" ON "Comision"("clienteId");

-- CreateIndex
CREATE INDEX "Comision_fecha_idx" ON "Comision"("fecha");
