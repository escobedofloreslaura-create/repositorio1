import type { TipoPrecioCliente } from "./constantes";

export interface PosDepartamentoT {
  id: string;
  nombre: string;
  orden: number;
}

export interface PosSucursalT {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  activa: boolean;
}

export interface PosProductoT {
  id: string;
  codigoBarras: string | null;
  nombre: string;
  departamentoId: string;
  departamento?: PosDepartamentoT;
  unidad: "PIEZA" | "CAJA";
  /** Ausente para sesiones de cajero: el precio de costo es confidencial, solo lo ve un administrador. */
  precioCosto?: number;
  precioVenta: number;
  precioMayoreo: number | null;
  precioClienteFrecuente: number | null;
  existencia: number;
  existenciaMinima: number;
  existenciasPorSucursal?: { sucursalId: string; sucursalNombre: string; existencia: number; esPropia: boolean }[];
  activo: boolean;
}

export interface PosClienteT {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  limiteCredito: number;
  saldoActual: number;
  /** Precio que se le aplica en automático al agregarlo a una venta: venta normal, mayoreo o cliente frecuente. */
  tipoPrecio: TipoPrecioCliente;
  activo: boolean;
}

export interface ItemTicket {
  claveLocal: string;
  productoId: string | null;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  precioNormal: number;
  precioMayoreo: number | null;
  esMayoreo: boolean;
  precioClienteFrecuente: number | null;
  esClienteFrecuente: boolean;
  existenciaDisponible: number | null;
}

export interface PosCorteT {
  id: string;
  fecha: string;
  fondoInicial: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  totalCobroClientes: number;
  totalPagoProveedores: number;
  totalSalidas: number;
  totalEntradasManuales: number;
  ventasTotales: number;
  /** Ausente para sesiones de cajero: la ganancia es confidencial, solo la ve un administrador. */
  costoVentas?: number;
  gananciaReal?: number;
  ventasPorDepartamento?: { departamento: string; total: number }[];
  /** Detalle de salidas, pagos a proveedores y entradas manuales, con su concepto. */
  movimientosDetalle?: { tipo: string; concepto: string; monto: number }[];
  efectivoEsperado: number;
  usuario: { nombre: string };
}

export interface Ticket {
  id: string;
  nombre: string;
  items: ItemTicket[];
  clienteId: string | null;
  clienteNombre: string | null;
  /** Tipo de precio del cliente asignado a esta cuenta; null cuando es venta al público en general. */
  clienteTipoPrecio: TipoPrecioCliente | null;
}
