import { Badge } from "./badge";

export function TemperaturaBadge({ temperatura }: { temperatura: string }) {
  if (temperatura === "Caliente") return <Badge variante="caliente">🔥 Caliente</Badge>;
  if (temperatura === "Frio") return <Badge variante="frio">🔵 Frío</Badge>;
  return <Badge variante="tibio">🟡 Tibio</Badge>;
}
