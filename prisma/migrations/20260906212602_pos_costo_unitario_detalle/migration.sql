-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PosDetalleVenta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ventaId" TEXT NOT NULL,
    "productoId" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "precioUnitario" REAL NOT NULL,
    "costoUnitario" REAL NOT NULL DEFAULT 0,
    "esMayoreo" BOOLEAN NOT NULL DEFAULT false,
    "subtotal" REAL NOT NULL,
    "cantidadDevuelta" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "PosDetalleVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "PosVenta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PosDetalleVenta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "PosProducto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PosDetalleVenta" ("cantidad", "cantidadDevuelta", "descripcion", "esMayoreo", "id", "precioUnitario", "productoId", "subtotal", "ventaId") SELECT "cantidad", "cantidadDevuelta", "descripcion", "esMayoreo", "id", "precioUnitario", "productoId", "subtotal", "ventaId" FROM "PosDetalleVenta";
DROP TABLE "PosDetalleVenta";
ALTER TABLE "new_PosDetalleVenta" RENAME TO "PosDetalleVenta";
CREATE INDEX "PosDetalleVenta_ventaId_idx" ON "PosDetalleVenta"("ventaId");
CREATE INDEX "PosDetalleVenta_productoId_idx" ON "PosDetalleVenta"("productoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
