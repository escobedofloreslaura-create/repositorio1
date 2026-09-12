-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PosCliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sucursalId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "limiteCredito" REAL NOT NULL DEFAULT 0,
    "saldoActual" REAL NOT NULL DEFAULT 0,
    "tipoPrecio" TEXT NOT NULL DEFAULT 'VENTA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "PosCliente_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "PosSucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PosCliente" ("activo", "actualizadoEn", "creadoEn", "direccion", "id", "limiteCredito", "nombre", "saldoActual", "sucursalId", "telefono") SELECT "activo", "actualizadoEn", "creadoEn", "direccion", "id", "limiteCredito", "nombre", "saldoActual", "sucursalId", "telefono" FROM "PosCliente";
DROP TABLE "PosCliente";
ALTER TABLE "new_PosCliente" RENAME TO "PosCliente";
CREATE INDEX "PosCliente_nombre_idx" ON "PosCliente"("nombre");
CREATE INDEX "PosCliente_sucursalId_idx" ON "PosCliente"("sucursalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
