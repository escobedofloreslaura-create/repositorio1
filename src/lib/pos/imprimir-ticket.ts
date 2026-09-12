import { formatearMoneda, formatearFechaImpresion } from "@/lib/formato";
import { ETIQUETAS_FORMA_PAGO, type FormaPago } from "@/lib/pos/constantes";
import { escpos, qzImprimirRaw } from "@/lib/pos/qz";

interface ItemTicketImprimir {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

interface PagoTicketImprimir {
  forma: FormaPago;
  monto: number;
  referencia?: string | null;
}

interface ConfigTicket {
  nombreNegocio: string;
  direccion?: string | null;
  telefono?: string | null;
  mensajeTicket: string;
  logoUrl?: string | null;
  simboloMoneda: string;
}

export interface DatosTicket {
  folio: number;
  fecha: string | Date;
  cajero: string;
  cliente?: string | null;
  items: ItemTicketImprimir[];
  pagos: PagoTicketImprimir[];
  total: number;
  config: ConfigTicket;
}

function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function imprimirTicket(params: DatosTicket) {
  const { folio, fecha, cajero, cliente, items, pagos, total, config } = params;
  const moneda = (m: number) => formatearMoneda(m, config.simboloMoneda);

  const filasItems = items
    .map(
      (i) => `
        <tr>
          <td colspan="3" class="nombre">${escaparHtml(i.descripcion)}</td>
        </tr>
        <tr>
          <td>${i.cantidad} x ${moneda(i.precioUnitario)}</td>
          <td></td>
          <td class="derecha">${moneda(i.cantidad * i.precioUnitario)}</td>
        </tr>`
    )
    .join("");

  const filasPagos = pagos
    .map(
      (p) => `
        <tr><td>${ETIQUETAS_FORMA_PAGO[p.forma]}</td><td></td><td class="derecha">${moneda(p.monto)}</td></tr>
        ${p.referencia ? `<tr><td colspan="3" class="ref">Folio: ${escaparHtml(p.referencia)}</td></tr>` : ""}`
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Ticket #${folio}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Courier New", monospace; width: 300px; margin: 0 auto; padding: 12px; color: #000; font-size: 13px; }
  h1 { font-size: 16px; text-align: center; margin: 0 0 4px; }
  .centro { text-align: center; }
  .logo { display: block; max-width: 160px; max-height: 100px; margin: 0 auto 6px; }
  .linea { border-top: 1px dashed #000; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; }
  td.nombre { padding-top: 6px; font-weight: bold; }
  td.derecha { text-align: right; white-space: nowrap; }
  td.ref { font-size: 11px; color: #444; padding-top: 0; }
  .total { font-size: 15px; font-weight: bold; }
  .pie { text-align: center; margin-top: 10px; font-size: 12px; }
</style>
</head>
<body>
  ${config.logoUrl ? `<img class="logo" src="${config.logoUrl}" alt="" />` : ""}
  <h1>${escaparHtml(config.nombreNegocio)}</h1>
  ${config.direccion ? `<p class="centro">${escaparHtml(config.direccion)}</p>` : ""}
  ${config.telefono ? `<p class="centro">Tel: ${escaparHtml(config.telefono)}</p>` : ""}
  <div class="linea"></div>
  <p>Ticket: #${folio}<br/>Fecha: ${formatearFechaImpresion(fecha)}<br/>Cajero: ${escaparHtml(cajero)}<br/>Cliente: ${escaparHtml(cliente || "Público en general")}</p>
  <div class="linea"></div>
  <table>${filasItems}</table>
  <div class="linea"></div>
  <table>
    <tr class="total"><td>Total</td><td></td><td class="derecha">${moneda(total)}</td></tr>
  </table>
  <div class="linea"></div>
  <table>${filasPagos}</table>
  <div class="linea"></div>
  <p class="pie">${escaparHtml(config.mensajeTicket)}</p>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const ventana = window.open("", "_blank", "width=380,height=600");
  if (!ventana) return;
  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
}

// ─── Impresión térmica silenciosa (ESC/POS vía QZ Tray) ───────────────────────
// 32 caracteres por línea: es el ancho más chico común (papel de 58mm) por lo
// que también cabe, con margen, en tickets de 80mm.
const ANCHO_TICKET = 32;

function envolverTexto(texto: string, ancho = ANCHO_TICKET): string[] {
  const palabras = texto.split(" ");
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of palabras) {
    const propuesta = actual ? `${actual} ${palabra}` : palabra;
    if (propuesta.length > ancho && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = propuesta;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.length > 0 ? lineas : [""];
}

function filaDosColumnas(izquierda: string, derecha: string, ancho = ANCHO_TICKET): string {
  const espacio = Math.max(1, ancho - izquierda.length - derecha.length);
  return izquierda + " ".repeat(espacio) + derecha + "\n";
}

export function construirComandosTicket(params: DatosTicket): string[] {
  const { folio, fecha, cajero, cliente, items, pagos, total, config } = params;
  const moneda = (m: number) => formatearMoneda(m, config.simboloMoneda);
  const linea = "-".repeat(ANCHO_TICKET) + "\n";
  const cmds: string[] = [];

  cmds.push(escpos.inicializar, escpos.centrar, escpos.negritaOn, escpos.dobleAltoOn);
  envolverTexto(config.nombreNegocio, 16).forEach((l) => cmds.push(l + "\n"));
  cmds.push(escpos.dobleAltoOff, escpos.negritaOff);
  if (config.direccion) envolverTexto(config.direccion).forEach((l) => cmds.push(l + "\n"));
  if (config.telefono) cmds.push(`Tel: ${config.telefono}\n`);
  cmds.push(escpos.izquierda, linea);
  cmds.push(`Ticket: #${folio}\n`, `Fecha: ${formatearFechaImpresion(fecha)}\n`, `Cajero: ${cajero}\n`);
  cmds.push(`Cliente: ${cliente || "Público en general"}\n`);
  cmds.push(linea);

  for (const item of items) {
    envolverTexto(item.descripcion).forEach((l) => cmds.push(l + "\n"));
    cmds.push(filaDosColumnas(`${item.cantidad} x ${moneda(item.precioUnitario)}`, moneda(item.cantidad * item.precioUnitario)));
  }
  cmds.push(linea, escpos.negritaOn, filaDosColumnas("TOTAL", moneda(total)), escpos.negritaOff, linea);

  for (const pago of pagos) {
    cmds.push(filaDosColumnas(ETIQUETAS_FORMA_PAGO[pago.forma], moneda(pago.monto)));
    if (pago.referencia) cmds.push(`Folio: ${pago.referencia}\n`);
  }
  cmds.push(linea, escpos.centrar);
  envolverTexto(config.mensajeTicket).forEach((l) => cmds.push(l + "\n"));
  cmds.push(escpos.salto, escpos.salto, escpos.salto, escpos.cortar);

  return cmds;
}

/**
 * Intenta imprimir en silencio en la impresora térmica configurada vía QZ
 * Tray (sin diálogo de impresión); si QZ Tray no está instalado/corriendo,
 * o no hay impresora configurada, cae de vuelta al diálogo del navegador.
 */
export async function imprimirTicketAutomatico(
  params: DatosTicket,
  impresoraQz: string | null | undefined
): Promise<"qz" | "navegador"> {
  if (impresoraQz) {
    try {
      await qzImprimirRaw(impresoraQz, construirComandosTicket(params));
      return "qz";
    } catch (e) {
      console.warn("No se pudo imprimir vía QZ Tray, usando el diálogo del navegador:", e);
    }
  }
  imprimirTicket(params);
  return "navegador";
}
