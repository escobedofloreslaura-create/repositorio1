export const DEPARTAMENTOS_POS = [
  "Vinos y Licores",
  "Refrescos y Varios",
  "Dulcería",
  "Cervezas",
] as const;

export const UNIDADES_PRODUCTO = ["PIEZA", "CAJA"] as const;

export const FORMAS_PAGO = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "CREDITO"] as const;
export type FormaPago = (typeof FORMAS_PAGO)[number];

export const ETIQUETAS_FORMA_PAGO: Record<FormaPago, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
  CREDITO: "Crédito",
};

export const TIPOS_MOVIMIENTO_CAJA = [
  "FONDO_INICIAL",
  "VENTA_EFECTIVO",
  "VENTA_TARJETA",
  "VENTA_TRANSFERENCIA",
  "COBRO_CLIENTE_EFECTIVO",
  "COBRO_CLIENTE_TARJETA",
  "COBRO_CLIENTE_TRANSFERENCIA",
  "SALIDA",
  "PAGO_PROVEEDOR",
  "ENTRADA_MANUAL",
  "CANCELACION",
  "DEVOLUCION",
] as const;

// Rubro de caja al que corresponde cada venta según su forma de pago. Se usa
// para registrar el movimiento de caja de una venta y para revertirlo
// (cancelaciones/devoluciones) en el mismo rubro, con signo negativo, de modo
// que el corte de caja lo neteé correctamente.
export const TIPO_VENTA_POR_FORMA: Partial<Record<FormaPago, (typeof TIPOS_MOVIMIENTO_CAJA)[number]>> = {
  EFECTIVO: "VENTA_EFECTIVO",
  TARJETA: "VENTA_TARJETA",
  TRANSFERENCIA: "VENTA_TRANSFERENCIA",
};

export type FormaAbono = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";

// Igual que arriba pero para abonos de clientes a crédito: solo el efectivo
// debe sumarse al efectivo esperado en caja al cerrar el turno.
export const TIPO_COBRO_CLIENTE_POR_FORMA: Record<FormaAbono, (typeof TIPOS_MOVIMIENTO_CAJA)[number]> = {
  EFECTIVO: "COBRO_CLIENTE_EFECTIVO",
  TARJETA: "COBRO_CLIENTE_TARJETA",
  TRANSFERENCIA: "COBRO_CLIENTE_TRANSFERENCIA",
};

export const TIPOS_MOVIMIENTO_INVENTARIO = [
  "ENTRADA",
  "SALIDA",
  "AJUSTE",
  "VENTA",
  "CANCELACION",
  "DEVOLUCION",
  "TRASPASO_ENTRADA",
  "TRASPASO_SALIDA",
] as const;

export const LIMITE_ADMIN_GENERAL = 2;
