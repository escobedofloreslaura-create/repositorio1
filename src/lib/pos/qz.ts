// Integración con QZ Tray para impresión silenciosa en la impresora térmica,
// sin el diálogo de impresión del navegador. Requiere que QZ Tray esté
// instalado y corriendo en la computadora de la caja (https://qz.io/download/).
//
// No firmamos las peticiones (modo "anónimo"): la primera vez que se imprime,
// QZ Tray muestra un aviso de "Acción requerida" que el cajero acepta una
// sola vez marcando "recordar esta decisión" — después de eso, todo es
// silencioso. Esto es suficiente para una sola sucursal; si se necesita
// evitar ese primer aviso, QZ Tray soporta certificados firmados (de pago
// o autogenerados) vía qz.security.setCertificatePromise/setSignaturePromise.

type QzModulo = typeof import("qz-tray").default;

let qzModulo: QzModulo | null = null;

async function obtenerQz(): Promise<QzModulo> {
  if (typeof window === "undefined") throw new Error("QZ Tray solo funciona en el navegador");
  if (!qzModulo) {
    qzModulo = (await import("qz-tray")).default;
  }
  return qzModulo;
}

export async function qzEstaConectado(): Promise<boolean> {
  try {
    const qz = await obtenerQz();
    return qz.websocket.isActive();
  } catch {
    return false;
  }
}

export async function qzConectar(): Promise<void> {
  const qz = await obtenerQz();
  if (qz.websocket.isActive()) return;
  await qz.websocket.connect();
}

export async function qzListarImpresoras(): Promise<string[]> {
  const qz = await obtenerQz();
  await qzConectar();
  const resultado = await qz.printers.find();
  return Array.isArray(resultado) ? resultado : [resultado];
}

export async function qzImprimirRaw(impresora: string, comandos: string[]): Promise<void> {
  const qz = await obtenerQz();
  await qzConectar();
  const config = qz.configs.create(impresora);
  await qz.print(config, comandos);
}

// ─── Comandos ESC/POS ────────────────────────────────────────────────────────
const ESC = "\x1B";
const GS = "\x1D";

export const escpos = {
  inicializar: ESC + "@",
  centrar: ESC + "a" + "\x01",
  izquierda: ESC + "a" + "\x00",
  negritaOn: ESC + "E" + "\x01",
  negritaOff: ESC + "E" + "\x00",
  dobleAltoOn: GS + "!" + "\x11",
  dobleAltoOff: GS + "!" + "\x00",
  salto: "\n",
  cortar: GS + "V" + "\x01",
};
