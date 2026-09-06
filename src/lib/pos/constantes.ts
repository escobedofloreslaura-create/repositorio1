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
  "COBRO_CLIENTE",
  "SALIDA",
  "PAGO_PROVEEDOR",
  "ENTRADA_MANUAL",
  "CANCELACION",
  "DEVOLUCION",
] as const;

export const TIPOS_MOVIMIENTO_INVENTARIO = [
  "ENTRADA",
  "SALIDA",
  "AJUSTE",
  "VENTA",
  "CANCELACION",
  "DEVOLUCION",
] as const;
