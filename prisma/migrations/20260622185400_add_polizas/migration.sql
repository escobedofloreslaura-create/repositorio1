-- CreateTable
CREATE TABLE "Poliza" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "numeroPoliza" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "aseguradora" TEXT NOT NULL,
    "formaPago" TEXT NOT NULL DEFAULT 'MENSUAL',
    "fechaProximoPago" DATETIME,
    "monto" REAL,
    "notas" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Poliza_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Poliza_clienteId_idx" ON "Poliza"("clienteId");
