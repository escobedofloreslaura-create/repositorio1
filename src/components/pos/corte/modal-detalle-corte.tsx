"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { formatearFecha } from "@/lib/formato";
import { ResumenCorte } from "./resumen-corte";
import type { PosCorteT } from "@/lib/pos/tipos";

export function ModalDetalleCorte({ corteId, onCerrar }: { corteId: string; onCerrar: () => void }) {
  const [corte, setCorte] = useState<PosCorteT | null>(null);

  useEffect(() => {
    fetch(`/api/pos/corte/${corteId}`)
      .then((r) => r.json())
      .then((json) => { if (json.ok) setCorte(json.data); });
  }, [corteId]);

  return (
    <Modal abierto onCerrar={onCerrar} titulo={corte ? `Corte del ${formatearFecha(corte.fecha)}` : "Corte de caja"} tamano="lg">
      {!corte ? (
        <p className="text-sm text-texto-suave">Cargando…</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-texto-suave">Cerrado por {corte.usuario.nombre}</p>
          <ResumenCorte corte={corte} />
        </div>
      )}
    </Modal>
  );
}
