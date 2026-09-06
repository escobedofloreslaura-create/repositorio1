import { ClienteDetalle } from "@/components/pos/clientes/cliente-detalle";

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClienteDetalle id={id} />;
}
