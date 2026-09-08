import { formatearMoneda, formatearFechaHumana } from "@/lib/formato";
import { escpos, qzImprimirRaw } from "@/lib/pos/qz";

interface ConfigCorte {
  nombreNegocio: string;
  direccion?: string | null;
  telefono?: string | null;
  logoUrl?: string | null;
  simboloMoneda: string;
}

export interface DatosCorte {
  fecha: string | Date;
  cerradoPor: string;
  fondoInicial: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  totalCobroClientes: number;
  totalEntradasManuales: number;
  totalPagoProveedores: number;
  totalSalidas: number;
  ventasTotales: number;
  gananciaReal: number;
  efectivoEsperado: number;
  config: ConfigCorte;
}

function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

const FILAS_CORTE: { clave: keyof DatosCorte; etiqueta: string }[] = [
  { clave: "fondoInicial", etiqueta: "Fondo inicial" },
  { clave: "totalEfectivo", etiqueta: "Ventas de contado (efectivo)" },
  { clave: "totalTarjeta", etiqueta: "Ventas con tarjeta" },
  { clave: "totalTransferencia", etiqueta: "Ventas por transferencia" },
  { clave: "totalCobroClientes", etiqueta: "Cobro a clientes" },
  { clave: "totalEntradasManuales", etiqueta: "Entradas de efectivo" },
  { clave: "totalPagoProveedores", etiqueta: "Pagos a proveedores" },
  { clave: "totalSalidas", etiqueta: "Salidas de dinero" },
];

export function imprimirCorte(params: DatosCorte) {
  const { fecha, cerradoPor, ventasTotales, gananciaReal, efectivoEsperado, config } = params;
  const moneda = (m: number) => formatearMoneda(m, config.simboloMoneda);

  const filas = FILAS_CORTE.map(
    (f) => `<tr><td>${f.etiqueta}</td><td class="derecha">${moneda(params[f.clave] as number)}</td></tr>`
  ).join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Corte de caja</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: "Courier New", monospace; width: 300px; margin: 0 auto; padding: 12px; color: #000; font-size: 13px; }
  h1 { font-size: 16px; text-align: center; margin: 0 0 4px; }
  h2 { font-size: 14px; text-align: center; margin: 4px 0; }
  .centro { text-align: center; }
  .logo { display: block; max-width: 160px; max-height: 100px; margin: 0 auto 6px; }
  .linea { border-top: 1px dashed #000; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; }
  td.derecha { text-align: right; white-space: nowrap; }
  .total { font-size: 14px; font-weight: bold; }
</style>
</head>
<body>
  ${config.logoUrl ? `<img class="logo" src="${config.logoUrl}" alt="" />` : ""}
  <h1>${escaparHtml(config.nombreNegocio)}</h1>
  ${config.direccion ? `<p class="centro">${escaparHtml(config.direccion)}</p>` : ""}
  ${config.telefono ? `<p class="centro">Tel: ${escaparHtml(config.telefono)}</p>` : ""}
  <div class="linea"></div>
  <h2>Corte de caja</h2>
  <p>Fecha: ${formatearFechaHumana(fecha)}<br/>Cerrado por: ${escaparHtml(cerradoPor)}</p>
  <div class="linea"></div>
  <table>${filas}</table>
  <div class="linea"></div>
  <table>
    <tr class="total"><td>Ventas totales</td><td class="derecha">${moneda(ventasTotales)}</td></tr>
    <tr class="total"><td>Ganancia real</td><td class="derecha">${moneda(gananciaReal)}</td></tr>
  </table>
  <div class="linea"></div>
  <table>
    <tr class="total"><td>Efectivo esperado</td><td class="derecha">${moneda(efectivoEsperado)}</td></tr>
  </table>
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

export function construirComandosCorte(params: DatosCorte): string[] {
  const { fecha, cerradoPor, ventasTotales, gananciaReal, efectivoEsperado, config } = params;
  const moneda = (m: number) => formatearMoneda(m, config.simboloMoneda);
  const linea = "-".repeat(ANCHO_TICKET) + "\n";
  const cmds: string[] = [];

  cmds.push(escpos.inicializar, escpos.centrar, escpos.negritaOn, escpos.dobleAltoOn);
  envolverTexto(config.nombreNegocio, 16).forEach((l) => cmds.push(l + "\n"));
  cmds.push(escpos.dobleAltoOff, escpos.negritaOff);
  if (config.direccion) envolverTexto(config.direccion).forEach((l) => cmds.push(l + "\n"));
  if (config.telefono) cmds.push(`Tel: ${config.telefono}\n`);
  cmds.push(escpos.izquierda, linea, escpos.centrar, escpos.negritaOn, "CORTE DE CAJA\n", escpos.negritaOff, escpos.izquierda);
  cmds.push(`Fecha: ${formatearFechaHumana(fecha)}\n`, `Cerrado por: ${cerradoPor}\n`, linea);

  for (const f of FILAS_CORTE) cmds.push(filaDosColumnas(f.etiqueta, moneda(params[f.clave] as number)));
  cmds.push(linea, escpos.negritaOn);
  cmds.push(filaDosColumnas("Ventas totales", moneda(ventasTotales)));
  cmds.push(filaDosColumnas("Ganancia real", moneda(gananciaReal)));
  cmds.push(linea);
  cmds.push(filaDosColumnas("Efectivo esperado", moneda(efectivoEsperado)));
  cmds.push(escpos.negritaOff, escpos.salto, escpos.salto, escpos.salto, escpos.cortar);

  return cmds;
}

/**
 * Intenta imprimir en silencio en la impresora térmica configurada vía QZ
 * Tray (sin diálogo de impresión); si QZ Tray no está instalado/corriendo, o
 * no hay impresora configurada, cae de vuelta al diálogo del navegador.
 */
export async function imprimirCorteAutomatico(
  params: DatosCorte,
  impresoraQz: string | null | undefined
): Promise<"qz" | "navegador"> {
  if (impresoraQz) {
    try {
      await qzImprimirRaw(impresoraQz, construirComandosCorte(params));
      return "qz";
    } catch (e) {
      console.warn("No se pudo imprimir vía QZ Tray, usando el diálogo del navegador:", e);
    }
  }
  imprimirCorte(params);
  return "navegador";
}
