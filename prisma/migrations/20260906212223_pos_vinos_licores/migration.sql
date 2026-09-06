-- CreateTable
CREATE TABLE "PosUsuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "contrasenaHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'CAJERO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PosSesionToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEn" DATETIME NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PosSesionToken_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "PosUsuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PosDepartamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "PosProducto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoBarras" TEXT,
    "nombre" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'PIEZA',
    "precioCosto" REAL NOT NULL DEFAULT 0,
    "precioVenta" REAL NOT NULL DEFAULT 0,
    "precioMayoreo" REAL,
    "existencia" REAL NOT NULL DEFAULT 0,
    "existenciaMinima" REAL NOT NULL DEFAULT 5,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "PosProducto_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "PosDepartamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PosCliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "limiteCredito" REAL NOT NULL DEFAULT 0,
    "saldoActual" REAL NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PosTurno" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "fondoInicial" REAL NOT NULL DEFAULT 0,
    "abiertoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradoEn" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTO',
    CONSTRAINT "PosTurno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "PosUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PosMovimientoCaja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "turnoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "concepto" TEXT,
    "usuarioId" TEXT NOT NULL,
    "ventaId" TEXT,
    "clienteId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PosMovimientoCaja_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "PosTurno" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PosMovimientoCaja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "PosUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosMovimientoCaja_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "PosVenta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PosCorteCaja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "turnoId" TEXT NOT NULL,
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
    CONSTRAINT "PosCorteCaja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "PosUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PosVenta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folio" INTEGER NOT NULL,
    "turnoId" TEXT NOT NULL,
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
    CONSTRAINT "PosVenta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "PosCliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PosVenta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "PosUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PosDetalleVenta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ventaId" TEXT NOT NULL,
    "productoId" TEXT,
    "descripcion" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "precioUnitario" REAL NOT NULL,
    "esMayoreo" BOOLEAN NOT NULL DEFAULT false,
    "subtotal" REAL NOT NULL,
    "cantidadDevuelta" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "PosDetalleVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "PosVenta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PosDetalleVenta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "PosProducto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PosPagoVenta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ventaId" TEXT NOT NULL,
    "forma" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    CONSTRAINT "PosPagoVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "PosVenta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PosDevolucion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ventaId" TEXT NOT NULL,
    "detalleVentaId" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "monto" REAL NOT NULL,
    "motivo" TEXT,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PosDevolucion_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "PosVenta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosDevolucion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "PosUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PosMovimientoInventario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "existenciaAnterior" REAL NOT NULL,
    "existenciaNueva" REAL NOT NULL,
    "detalle" TEXT,
    "usuarioId" TEXT NOT NULL,
    "ventaId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PosMovimientoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "PosProducto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PosMovimientoInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "PosUsuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PosConfiguracion" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'principal',
    "nombreNegocio" TEXT NOT NULL DEFAULT 'Vinos y Licores',
    "direccion" TEXT,
    "telefono" TEXT,
    "rfc" TEXT,
    "mensajeTicket" TEXT NOT NULL DEFAULT '¡Gracias por su compra!',
    "logoUrl" TEXT,
    "impresora" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "simboloMoneda" TEXT NOT NULL DEFAULT '$',
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PosContadorFolio" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'ventas',
    "ultimo" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "PosUsuario_usuario_key" ON "PosUsuario"("usuario");

-- CreateIndex
CREATE INDEX "PosUsuario_usuario_idx" ON "PosUsuario"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "PosSesionToken_token_key" ON "PosSesionToken"("token");

-- CreateIndex
CREATE INDEX "PosSesionToken_token_idx" ON "PosSesionToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PosDepartamento_nombre_key" ON "PosDepartamento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "PosProducto_codigoBarras_key" ON "PosProducto"("codigoBarras");

-- CreateIndex
CREATE INDEX "PosProducto_nombre_idx" ON "PosProducto"("nombre");

-- CreateIndex
CREATE INDEX "PosProducto_departamentoId_idx" ON "PosProducto"("departamentoId");

-- CreateIndex
CREATE INDEX "PosProducto_codigoBarras_idx" ON "PosProducto"("codigoBarras");

-- CreateIndex
CREATE INDEX "PosCliente_nombre_idx" ON "PosCliente"("nombre");

-- CreateIndex
CREATE INDEX "PosTurno_usuarioId_idx" ON "PosTurno"("usuarioId");

-- CreateIndex
CREATE INDEX "PosTurno_estado_idx" ON "PosTurno"("estado");

-- CreateIndex
CREATE INDEX "PosMovimientoCaja_turnoId_idx" ON "PosMovimientoCaja"("turnoId");

-- CreateIndex
CREATE INDEX "PosMovimientoCaja_tipo_idx" ON "PosMovimientoCaja"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "PosCorteCaja_turnoId_key" ON "PosCorteCaja"("turnoId");

-- CreateIndex
CREATE INDEX "PosCorteCaja_fecha_idx" ON "PosCorteCaja"("fecha");

-- CreateIndex
CREATE INDEX "PosVenta_folio_idx" ON "PosVenta"("folio");

-- CreateIndex
CREATE INDEX "PosVenta_turnoId_idx" ON "PosVenta"("turnoId");

-- CreateIndex
CREATE INDEX "PosVenta_clienteId_idx" ON "PosVenta"("clienteId");

-- CreateIndex
CREATE INDEX "PosVenta_fecha_idx" ON "PosVenta"("fecha");

-- CreateIndex
CREATE INDEX "PosVenta_estado_idx" ON "PosVenta"("estado");

-- CreateIndex
CREATE INDEX "PosDetalleVenta_ventaId_idx" ON "PosDetalleVenta"("ventaId");

-- CreateIndex
CREATE INDEX "PosDetalleVenta_productoId_idx" ON "PosDetalleVenta"("productoId");

-- CreateIndex
CREATE INDEX "PosPagoVenta_ventaId_idx" ON "PosPagoVenta"("ventaId");

-- CreateIndex
CREATE INDEX "PosDevolucion_ventaId_idx" ON "PosDevolucion"("ventaId");

-- CreateIndex
CREATE INDEX "PosMovimientoInventario_productoId_idx" ON "PosMovimientoInventario"("productoId");

-- CreateIndex
CREATE INDEX "PosMovimientoInventario_creadoEn_idx" ON "PosMovimientoInventario"("creadoEn");

-- CreateIndex
CREATE INDEX "PosMovimientoInventario_tipo_idx" ON "PosMovimientoInventario"("tipo");
