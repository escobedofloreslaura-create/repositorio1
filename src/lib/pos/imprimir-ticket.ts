import { formatearMoneda, formatearFechaHumana } from "@/lib/formato";
import { ETIQUETAS_FORMA_PAGO, type FormaPago } from "@/lib/pos/constantes";

interface ItemTicketImprimir {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

interface PagoTicketImprimir {
  forma: FormaPago;
  monto: number;
}

interface ConfigTicket {
  nombreNegocio: string;
  direccion?: string | null;
  telefono?: string | null;
  mensajeTicket: string;
  simboloMoneda: string;
}

function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function imprimirTicket(params: {
  folio: number;
  fecha: string | Date;
  cajero: string;
  cliente?: string | null;
  items: ItemTicketImprimir[];
  pagos: PagoTicketImprimir[];
  total: number;
  config: ConfigTicket;
}) {
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
    .map((p) => `<tr><td>${ETIQUETAS_FORMA_PAGO[p.forma]}</td><td></td><td class="derecha">${moneda(p.monto)}</td></tr>`)
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
  .linea { border-top: 1px dashed #000; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; }
  td.nombre { padding-top: 6px; font-weight: bold; }
  td.derecha { text-align: right; white-space: nowrap; }
  .total { font-size: 15px; font-weight: bold; }
  .pie { text-align: center; margin-top: 10px; font-size: 12px; }
</style>
</head>
<body>
  <h1>${escaparHtml(config.nombreNegocio)}</h1>
  ${config.direccion ? `<p class="centro">${escaparHtml(config.direccion)}</p>` : ""}
  ${config.telefono ? `<p class="centro">Tel: ${escaparHtml(config.telefono)}</p>` : ""}
  <div class="linea"></div>
  <p>Ticket: #${folio}<br/>Fecha: ${formatearFechaHumana(fecha)}<br/>Cajero: ${escaparHtml(cajero)}${cliente ? `<br/>Cliente: ${escaparHtml(cliente)}` : ""}</p>
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
