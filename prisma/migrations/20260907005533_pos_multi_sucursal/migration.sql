/*
  Warnings:

  - The primary key for the `PosConfiguracion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PosConfiguracion` table. All the data in the column will be lost.
  - The primary key for the `PosContadorFolio` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PosContadorFolio` table. All the data in the column will be lost.
  - You are about to drop the column `existencia` on the `PosProducto` table. All the data in the column will be lost.
  - You are about to drop the column `existenciaMinima` on the `PosProducto` table. All the data in the column will be lost.
  - Added the required column `sucursalId` to the `PosCliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sucursalId` to the `PosConfiguracion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sucursalId` to the `PosContadorFolio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sucursalId` to the `PosCorteCaja` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sucursalId` to the `PosMovimientoInventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sucursalId` to the `PosTurno` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sucursalId` to the `PosVenta` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "PosSucursal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PosExistencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sucursalId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "existencia" REAL NOT NULL DEFAULT 0,
    "existenciaMinima" REAL NOT NULL DEFAULT 5,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "PosExistencia_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "PosSucursal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PosExistencia_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "PosProducto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PosTraspaso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productoId" TEXT NOT NULL,
    "sucursalOrigenId" TEXT NOT NULL,
    "sucursalDestinoId" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "motivo" TEXT,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PosTraspaso_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "PosProducto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosTraspaso_sucursalOrigenId_fkey" FOREIGN KEY ("sucursalOrigenId") REFERENCES "PosSucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosTraspaso_sucursalDestinoId_fkey" FOREIGN KEY ("sucursalDestinoId") REFERENCES "PosSucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosTraspaso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "PosUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "PosCliente_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "PosSucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PosCliente" ("activo", "actualizadoEn", "creadoEn", "direccion", "id", "limiteCredito", "nombre", "saldoActual", "telefono") SELECT "activo", "actualizadoEn", "creadoEn", "direccion", "id", "limiteCredito", "nombre", "saldoActual", "telefono" FROM "PosCliente";
DROP TABLE "PosCliente";
ALTER TABLE "new_PosCliente" RENAME TO "PosCliente";
CREATE INDEX "PosCliente_nombre_idx" ON "PosCliente"("nombre");
CREATE INDEX "PosCliente_sucursalId_idx" ON "PosCliente"("sucursalId");
CREATE TABLE "new_PosConfiguracion" (
    "sucursalId" TEXT NOT NULL PRIMARY KEY,
    "nombreNegocio" TEXT NOT NULL DEFAULT 'Vinos y Licores',
    "direccion" TEXT,
    "telefono" TEXT,
    "rfc" TEXT,
    "mensajeTicket" TEXT NOT NULL DEFAULT '¡Gracias por su compra!',
    "logoUrl" TEXT,
    "impresora" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "simboloMoneda" TEXT NOT NULL DEFAULT '$',
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "PosConfiguracion_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "PosSucursal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PosConfiguracion" ("actualizadoEn", "direccion", "impresora", "logoUrl", "mensajeTicket", "moneda", "nombreNegocio", "rfc", "simboloMoneda", "telefono") SELECT "actualizadoEn", "direccion", "impresora", "logoUrl", "mensajeTicket", "moneda", "nombreNegocio", "rfc", "simboloMoneda", "telefono" FROM "PosConfiguracion";
DROP TABLE "PosConfiguracion";
ALTER TABLE "new_PosConfiguracion" RENAME TO "PosConfiguracion";
CREATE TABLE "new_PosContadorFolio" (
    "sucursalId" TEXT NOT NULL PRIMARY KEY,
    "ultimo" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PosContadorFolio_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "PosSucursal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PosContadorFolio" ("ultimo") SELECT "ultimo" FROM "PosContadorFolio";
DROP TABLE "PosContadorFolio";
ALTER TABLE "new_PosContadorFolio" RENAME TO "PosContadorFolio";
CREATE TABLE "new_PosCorteCaja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "turnoId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fondoInicial" REAL NOT NULL,
    "totalEfectivo" REAL NOT NULL,
    "totalTarjeta" REAL NOT NULL,
    "totalTransferencia" REAL NOT NULL,
    "totalCobroClientes" REAL NOT NULL,
    "totalPagoProveedores" REAL NOT NULL,
    "totalSalidas" REAL NOT NULL,
    "totalEntradasManuales" REAL NOT NULL,
    "ventasTotales" REAL NOT NULL,
    "costoVentas" REAL NOT NULL,
    "gananciaReal" REAL NOT NULL,
    "efectivoEsperado" REAL NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PosCorteCaja_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "PosTurno" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosCorteCaja_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "PosSucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosCorteCaja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "PosUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PosCorteCaja" ("costoVentas", "creadoEn", "efectivoEsperado", "fecha", "fondoInicial", "gananciaReal", "id", "totalCobroClientes", "totalEfectivo", "totalEntradasManuales", "totalPagoProveedores", "totalSalidas", "totalTarjeta", "totalTransferencia", "turnoId", "usuarioId", "ventasTotales") SELECT "costoVentas", "creadoEn", "efectivoEsperado", "fecha", "fondoInicial", "gananciaReal", "id", "totalCobroClientes", "totalEfectivo", "totalEntradasManuales", "totalPagoProveedores", "totalSalidas", "totalTarjeta", "totalTransferencia", "turnoId", "usuarioId", "ventasTotales" FROM "PosCorteCaja";
DROP TABLE "PosCorteCaja";
ALTER TABLE "new_PosCorteCaja" RENAME TO "PosCorteCaja";
CREATE UNIQUE INDEX "PosCorteCaja_turnoId_key" ON "PosCorteCaja"("turnoId");
CREATE INDEX "PosCorteCaja_fecha_idx" ON "PosCorteCaja"("fecha");
CREATE INDEX "PosCorteCaja_sucursalId_idx" ON "PosCorteCaja"("sucursalId");
CREATE TABLE "new_PosMovimientoInventario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productoId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "existenciaAnterior" REAL NOT NULL,
    "existenciaNueva" REAL NOT NULL,
    "detalle" TEXT,
    "usuarioId" TEXT NOT NULL,
    "ventaId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PosMovimientoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "PosProducto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosMovimientoInventario_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "PosSucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosMovimientoInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "PosUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PosMovimientoInventario" ("cantidad", "creadoEn", "detalle", "existenciaAnterior", "existenciaNueva", "id", "productoId", "tipo", "usuarioId", "ventaId") SELECT "cantidad", "creadoEn", "detalle", "existenciaAnterior", "existenciaNueva", "id", "productoId", "tipo", "usuarioId", "ventaId" FROM "PosMovimientoInventario";
DROP TABLE "PosMovimientoInventario";
ALTER TABLE "new_PosMovimientoInventario" RENAME TO "PosMovimientoInventario";
CREATE INDEX "PosMovimientoInventario_productoId_idx" ON "PosMovimientoInventario"("productoId");
CREATE INDEX "PosMovimientoInventario_sucursalId_idx" ON "PosMovimientoInventario"("sucursalId");
CREATE INDEX "PosMovimientoInventario_creadoEn_idx" ON "PosMovimientoInventario"("creadoEn");
CREATE INDEX "PosMovimientoInventario_tipo_idx" ON "PosMovimientoInventario"("tipo");
CREATE TABLE "new_PosProducto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoBarras" TEXT,
    "nombre" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'PIEZA',
    "precioCosto" REAL NOT NULL DEFAULT 0,
    "precioVenta" REAL NOT NULL DEFAULT 0,
    "precioMayoreo" REAL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "PosProducto_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "PosDepartamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PosProducto" ("activo", "actualizadoEn", "codigoBarras", "creadoEn", "departamentoId", "id", "nombre", "precioCosto", "precioMayoreo", "precioVenta", "unidad") SELECT "activo", "actualizadoEn", "codigoBarras", "creadoEn", "departamentoId", "id", "nombre", "precioCosto", "precioMayoreo", "precioVenta", "unidad" FROM "PosProducto";
DROP TABLE "PosProducto";
ALTER TABLE "new_PosProducto" RENAME TO "PosProducto";
CREATE UNIQUE INDEX "PosProducto_codigoBarras_key" ON "PosProducto"("codigoBarras");
CREATE INDEX "PosProducto_nombre_idx" ON "PosProducto"("nombre");
CREATE INDEX "PosProducto_departamentoId_idx" ON "PosProducto"("departamentoId");
CREATE INDEX "PosProducto_codigoBarras_idx" ON "PosProducto"("codigoBarras");
CREATE TABLE "new_PosTurno" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "fondoInicial" REAL NOT NULL DEFAULT 0,
    "abiertoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradoEn" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    CONSTRAINT "PosTurno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "PosUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosTurno_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "PosSucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PosTurno" ("abiertoEn", "cerradoEn", "estado", "fondoInicial", "id", "usuarioId") SELECT "abiertoEn", "cerradoEn", "estado", "fondoInicial", "id", "usuarioId" FROM "PosTurno";
DROP TABLE "PosTurno";
ALTER TABLE "new_PosTurno" RENAME TO "PosTurno";
CREATE INDEX "PosTurno_usuarioId_idx" ON "PosTurno"("usuarioId");
CREATE INDEX "PosTurno_sucursalId_idx" ON "PosTurno"("sucursalId");
CREATE INDEX "PosTurno_estado_idx" ON "PosTurno"("estado");
CREATE TABLE "new_PosUsuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "contrasenaHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'CAJERO',
    "sucursalId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "PosUsuario_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "PosSucursal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PosUsuario" ("activo", "actualizadoEn", "bloqueadoHasta", "contrasenaHash", "creadoEn", "id", "intentosFallidos", "nombre", "rol", "usuario") SELECT "activo", "actualizadoEn", "bloqueadoHasta", "contrasenaHash", "creadoEn", "id", "intentosFallidos", "nombre", "rol", "usuario" FROM "PosUsuario";
DROP TABLE "PosUsuario";
ALTER TABLE "new_PosUsuario" RENAME TO "PosUsuario";
CREATE UNIQUE INDEX "PosUsuario_usuario_key" ON "PosUsuario"("usuario");
CREATE INDEX "PosUsuario_usuario_idx" ON "PosUsuario"("usuario");
CREATE INDEX "PosUsuario_sucursalId_idx" ON "PosUsuario"("sucursalId");
CREATE TABLE "new_PosVenta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folio" INTEGER NOT NULL,
    "turnoId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "clienteId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" REAL NOT NULL,
    "total" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'COMPLETADA',
    "notas" TEXT,
    "canceladaEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PosVenta_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "PosTurno" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosVenta_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "PosSucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosVenta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "PosCliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PosVenta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "PosUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PosVenta" ("canceladaEn", "clienteId", "creadoEn", "estado", "fecha", "folio", "id", "notas", "subtotal", "total", "turnoId", "usuarioId") SELECT "canceladaEn", "clienteId", "creadoEn", "estado", "fecha", "folio", "id", "notas", "subtotal", "total", "turnoId", "usuarioId" FROM "PosVenta";
DROP TABLE "PosVenta";
ALTER TABLE "new_PosVenta" RENAME TO "PosVenta";
CREATE INDEX "PosVenta_folio_idx" ON "PosVenta"("folio");
CREATE INDEX "PosVenta_turnoId_idx" ON "PosVenta"("turnoId");
CREATE INDEX "PosVenta_sucursalId_idx" ON "PosVenta"("sucursalId");
CREATE INDEX "PosVenta_clienteId_idx" ON "PosVenta"("clienteId");
CREATE INDEX "PosVenta_fecha_idx" ON "PosVenta"("fecha");
CREATE INDEX "PosVenta_estado_idx" ON "PosVenta"("estado");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PosSucursal_nombre_idx" ON "PosSucursal"("nombre");

-- CreateIndex
CREATE INDEX "PosExistencia_productoId_idx" ON "PosExistencia"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "PosExistencia_sucursalId_productoId_key" ON "PosExistencia"("sucursalId", "productoId");

-- CreateIndex
CREATE INDEX "PosTraspaso_productoId_idx" ON "PosTraspaso"("productoId");

-- CreateIndex
CREATE INDEX "PosTraspaso_sucursalOrigenId_idx" ON "PosTraspaso"("sucursalOrigenId");

-- CreateIndex
CREATE INDEX "PosTraspaso_sucursalDestinoId_idx" ON "PosTraspaso"("sucursalDestinoId");
