-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasenaHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'VENDEDOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "temaPreferido" TEXT NOT NULL DEFAULT 'sistema',
    "vistaCompacta" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompletado" BOOLEAN NOT NULL DEFAULT false,
    "metaMensual" REAL,
    "comision" REAL,
    "paginaAgendaActiva" BOOLEAN NOT NULL DEFAULT true,
    "paginaAgendaSlug" TEXT,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SesionToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiraEn" DATETIME NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SesionToken_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "telefonoInternacional" TEXT,
    "correo" TEXT,
    "origen" TEXT,
    "canalUtm" TEXT,
    "etapa" TEXT NOT NULL DEFAULT 'Nuevo',
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "temperatura" TEXT NOT NULL DEFAULT 'Tibio',
    "objecionPrincipal" TEXT,
    "valorEstimado" REAL,
    "notas" TEXT,
    "proximaAccion" TEXT,
    "proximaAccionFecha" DATETIME,
    "vendedorId" TEXT,
    "cumpleanos" DATETIME,
    "fechaRenovacion" DATETIME,
    "proximaRevision" DATETIME,
    "presupuesto" REAL,
    "productosInteres" TEXT,
    "ultimaCompra" DATETIME,
    "productosContratados" TEXT,
    "referidos" TEXT,
    "tipoPóliza" TEXT,
    "motivoPerdida" TEXT,
    "ultimoContactoEn" DATETIME,
    "eliminadoEn" DATETIME,
    "estadoAnterior" TEXT,
    "etapaAnterior" TEXT,
    "empresaNombre" TEXT,
    "empresaGiro" TEXT,
    "empresaPuesto" TEXT,
    "empresaRfc" TEXT,
    "empresaWeb" TEXT,
    "empresaDireccion" TEXT,
    "empresaTamano" TEXT,
    "empresaNotas" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    "ultimaModificacionEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cliente_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "vendedorId" TEXT,
    "fecha" DATETIME NOT NULL,
    "duracionMinutos" INTEGER NOT NULL DEFAULT 45,
    "tipo" TEXT NOT NULL DEFAULT 'Virtual',
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "notas" TEXT,
    "googleEventId" TEXT,
    "googleMeetUrl" TEXT,
    "eliminadoEn" DATETIME,
    "nombreProspecto" TEXT,
    "telefonoProspecto" TEXT,
    "correoProspecto" TEXT,
    "origenAgenda" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Cita_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Cita_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "montoTotal" REAL,
    "metodo" TEXT NOT NULL,
    "estatus" TEXT NOT NULL DEFAULT 'pendiente',
    "fechaPago" DATETIME,
    "fechaVencimiento" DATETIME,
    "concepto" TEXT,
    "folio" INTEGER,
    "notas" TEXT,
    "eliminadoEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Pago_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistorialAccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadatos" TEXT,
    CONSTRAINT "HistorialAccion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistorialAccion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recordatorio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "clienteId" TEXT,
    "texto" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "pospuesto" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recordatorio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recordatorio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Archivo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "subidoPorId" TEXT,
    "nombre" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL DEFAULT 'Otro',
    "tipo" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "datos" BLOB,
    "urlExterna" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Archivo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Archivo_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Etiqueta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#7b86e0',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EtiquetaCliente" (
    "clienteId" TEXT NOT NULL,
    "etiquetaId" TEXT NOT NULL,
    "asignadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("clienteId", "etiquetaId"),
    CONSTRAINT "EtiquetaCliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EtiquetaCliente_etiquetaId_fkey" FOREIGN KEY ("etiquetaId") REFERENCES "Etiqueta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlantillaMensaje" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "etapa" TEXT,
    "objecion" TEXT,
    "asunto" TEXT,
    "cuerpo" TEXT NOT NULL,
    "esFavorita" BOOLEAN NOT NULL DEFAULT false,
    "esSistema" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ConfigNegocio" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'principal',
    "nombre" TEXT NOT NULL DEFAULT 'LEF PATRIMONIAL',
    "logoUrl" TEXT,
    "colorMarca" TEXT NOT NULL DEFAULT '#7b86e0',
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "simboloMoneda" TEXT NOT NULL DEFAULT '$',
    "husoHorario" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "horarioInicio" INTEGER NOT NULL DEFAULT 10,
    "horarioFin" INTEGER NOT NULL DEFAULT 18,
    "duracionCitaMinutos" INTEGER NOT NULL DEFAULT 45,
    "metaMensualDinero" REAL DEFAULT 100000,
    "metaMensualClientes" INTEGER DEFAULT 10,
    "mensajeWhatsApp" TEXT NOT NULL DEFAULT 'Hola {nombre}, gracias por tu interés. ¿Te late si agendamos una llamada para platicarte cómo te puedo ayudar?',
    "umbralEstancamiento" INTEGER NOT NULL DEFAULT 7,
    "comisionGlobal" REAL,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MotivoPerdida" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Favorito" (
    "usuarioId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("usuarioId", "clienteId"),
    CONSTRAINT "Favorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favorito_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VistaGuardada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "filtros" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VistaGuardada_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroAuditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "recursoTipo" TEXT NOT NULL,
    "recursoId" TEXT,
    "descripcion" TEXT NOT NULL,
    "ipOrigen" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeadLanding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "correo" TEXT,
    "origen" TEXT,
    "canalUtm" TEXT,
    "vendedorSlug" TEXT,
    "procesado" BOOLEAN NOT NULL DEFAULT false,
    "clienteId" TEXT,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContadorFolio" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'pagos',
    "ultimo" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_paginaAgendaSlug_key" ON "Usuario"("paginaAgendaSlug");

-- CreateIndex
CREATE INDEX "Usuario_correo_idx" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "SesionToken_token_key" ON "SesionToken"("token");

-- CreateIndex
CREATE INDEX "SesionToken_token_idx" ON "SesionToken"("token");

-- CreateIndex
CREATE INDEX "Cliente_nombre_idx" ON "Cliente"("nombre");

-- CreateIndex
CREATE INDEX "Cliente_telefono_idx" ON "Cliente"("telefono");

-- CreateIndex
CREATE INDEX "Cliente_correo_idx" ON "Cliente"("correo");

-- CreateIndex
CREATE INDEX "Cliente_etapa_idx" ON "Cliente"("etapa");

-- CreateIndex
CREATE INDEX "Cliente_estado_idx" ON "Cliente"("estado");

-- CreateIndex
CREATE INDEX "Cliente_vendedorId_idx" ON "Cliente"("vendedorId");

-- CreateIndex
CREATE INDEX "Cliente_eliminadoEn_idx" ON "Cliente"("eliminadoEn");

-- CreateIndex
CREATE INDEX "Cliente_empresaNombre_idx" ON "Cliente"("empresaNombre");

-- CreateIndex
CREATE INDEX "Cita_clienteId_idx" ON "Cita"("clienteId");

-- CreateIndex
CREATE INDEX "Cita_vendedorId_idx" ON "Cita"("vendedorId");

-- CreateIndex
CREATE INDEX "Cita_fecha_idx" ON "Cita"("fecha");

-- CreateIndex
CREATE INDEX "Cita_estado_idx" ON "Cita"("estado");

-- CreateIndex
CREATE INDEX "Cita_eliminadoEn_idx" ON "Cita"("eliminadoEn");

-- CreateIndex
CREATE INDEX "Pago_clienteId_idx" ON "Pago"("clienteId");

-- CreateIndex
CREATE INDEX "Pago_estatus_idx" ON "Pago"("estatus");

-- CreateIndex
CREATE INDEX "Pago_fechaVencimiento_idx" ON "Pago"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "Pago_eliminadoEn_idx" ON "Pago"("eliminadoEn");

-- CreateIndex
CREATE INDEX "HistorialAccion_clienteId_idx" ON "HistorialAccion"("clienteId");

-- CreateIndex
CREATE INDEX "HistorialAccion_fecha_idx" ON "HistorialAccion"("fecha");

-- CreateIndex
CREATE INDEX "Recordatorio_usuarioId_idx" ON "Recordatorio"("usuarioId");

-- CreateIndex
CREATE INDEX "Recordatorio_fecha_idx" ON "Recordatorio"("fecha");

-- CreateIndex
CREATE INDEX "Archivo_clienteId_idx" ON "Archivo"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Etiqueta_nombre_key" ON "Etiqueta"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "MotivoPerdida_nombre_key" ON "MotivoPerdida"("nombre");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_usuarioId_idx" ON "RegistroAuditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_creadoEn_idx" ON "RegistroAuditoria"("creadoEn");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_recursoTipo_idx" ON "RegistroAuditoria"("recursoTipo");

-- CreateIndex
CREATE INDEX "LeadLanding_procesado_idx" ON "LeadLanding"("procesado");
