"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ReporteInventario } from "./reporte-inventario";
import { KardexPanel } from "./kardex-panel";

export function InventarioPanel({ puedeImportar }: { puedeImportar: boolean }) {
  const [tab, setTab] = useState<"reporte" | "kardex">("reporte");

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-texto mb-4">Inventario</h1>

      <div className="flex gap-1 mb-6 no-print">
        {(["reporte", "kardex"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              tab === t ? "bg-marca text-white" : "text-texto-suave hover:bg-surface-hover"
            )}
          >
            {t === "reporte" ? "Reporte general" : "Kardex / Auditoría"}
          </button>
        ))}
      </div>

      {tab === "reporte" ? <ReporteInventario puedeImportar={puedeImportar} /> : <KardexPanel />}
    </div>
  );
}
