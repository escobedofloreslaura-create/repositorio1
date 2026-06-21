export const ETAPAS_EMBUDO = [
  "Nuevo",
  "Contactado",
  "Cita agendada",
  "Cita Inicial",
  "Cita de Cierre",
  "Propuesta enviada",
  "Seguimiento a Propuesta enviada",
  "Cliente ganado",
  "Seguimiento Post Venta y Entrega de Póliza",
  "Perdido",
  "Reagendados",
  "Contactar más adelante",
  "Renovaciones o seguimiento a pagos",
] as const;

export const ETAPAS_ACTIVAS = ETAPAS_EMBUDO.filter(
  (e) => e !== "Cliente ganado" && e !== "Perdido"
);

export const PROBABILIDADES_ETAPA: Record<string, number> = {
  "Nuevo": 0.1,
  "Contactado": 0.2,
  "Cita agendada": 0.3,
  "Cita Inicial": 0.4,
  "Cita de Cierre": 0.6,
  "Propuesta enviada": 0.5,
  "Seguimiento a Propuesta enviada": 0.55,
  "Cliente ganado": 1,
  "Seguimiento Post Venta y Entrega de Póliza": 1,
  "Perdido": 0,
  "Reagendados": 0.3,
  "Contactar más adelante": 0.15,
  "Renovaciones o seguimiento a pagos": 0.8,
};

export const TEMPERATURAS = ["Caliente", "Tibio", "Frio"] as const;
export type Temperatura = typeof TEMPERATURAS[number];

export const ESTADOS_CLIENTE = ["ACTIVO", "GANADO", "PERDIDO", "ARCHIVADO"] as const;

export const METODOS_PAGO = [
  "Transferencia",
  "Tarjeta",
  "Liga de pago",
  "Efectivo",
  "Meses sin intereses",
] as const;

export const ORIGENES_CLIENTE = [
  "Instagram",
  "Facebook",
  "WhatsApp",
  "Recomendado",
  "Landing",
  "Agenda",
  "Evento",
  "Otro",
] as const;

export const OBJECIONES = [
  "Lo voy a pensar",
  "Tengo que consultarlo con mi pareja/socio",
  "Ya tengo otro proveedor",
  "No es buen momento",
  "Está muy caro",
  "No lo necesito ahorita",
  "Otro",
] as const;

export const ETIQUETAS_ARCHIVO = [
  "Comprobante",
  "Contrato",
  "Identificación",
  "Cotización",
  "Otro",
] as const;

export const COLOR_MARCA = "#7b86e0";

export const TIPOS_ARCHIVO_PERMITIDOS = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const TAMANO_MAX_ARCHIVO = 10 * 1024 * 1024; // 10 MB

export const NUMERO_WHATSAPP = "5212221234567"; // número de ejemplo
export const NUMERO_NEGOCIO = "221 234 5678";
