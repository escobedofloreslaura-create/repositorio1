import { Trophy, XCircle, Archive, CheckCircle2 } from "lucide-react";
import { Badge } from "./badge";

export function EstadoBadge({ estado }: { estado: string }) {
  if (estado === "GANADO") return <Badge variante="ganado"><Trophy className="h-3 w-3" /> Ganado</Badge>;
  if (estado === "PERDIDO") return <Badge variante="perdido"><XCircle className="h-3 w-3" /> Perdido</Badge>;
  if (estado === "ARCHIVADO") return <Badge variante="archivado"><Archive className="h-3 w-3" /> Archivado</Badge>;
  return <Badge variante="activo"><CheckCircle2 className="h-3 w-3" /> Activo</Badge>;
}
