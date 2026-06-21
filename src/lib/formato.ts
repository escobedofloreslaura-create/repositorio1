import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

export function formatearFechaHumana(fecha: Date | string): string {
  const d = new Date(fecha);
  if (isToday(d)) return `Hoy ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Ayer ${format(d, "h:mm a")}`;
  return format(d, "EEE d MMM, h:mm a", { locale: es });
}

export function formatearDistancia(fecha: Date | string): string {
  return formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es });
}

export function formatearFecha(fecha: Date | string): string {
  return format(new Date(fecha), "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatearFechaCorta(fecha: Date | string): string {
  return format(new Date(fecha), "dd/MM/yyyy");
}

export function formatearMoneda(
  monto: number,
  simbolo: string = "$",
  moneda: string = "MXN"
): string {
  return `${simbolo}${monto.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatearTelefono(tel: string): string {
  const limpio = tel.replace(/\D/g, "");
  if (limpio.length === 10) {
    return `${limpio.slice(0, 2)} ${limpio.slice(2, 6)} ${limpio.slice(6)}`;
  }
  return tel;
}

export function telefonoWhatsApp(tel: string): string {
  const limpio = tel.replace(/\D/g, "");
  if (limpio.startsWith("52")) return limpio;
  if (limpio.length === 10) return `52${limpio}`;
  return limpio;
}

export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
