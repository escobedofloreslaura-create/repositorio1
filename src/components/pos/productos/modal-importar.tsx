"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Modal } from "@/components/ui/modal";
import { Boton } from "@/components/ui/boton";
import { UploadCloud, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";

interface Resultado {
  creados: number;
  actualizados: number;
  errores: string[];
  total: number;
}

export function ModalImportar({ onCerrar, onImportado }: { onCerrar: () => void; onImportado: () => void }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const onDrop = useCallback((aceptados: File[]) => {
    if (aceptados[0]) setArchivo(aceptados[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  async function importar() {
    if (!archivo) return;
    setCargando(true);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const res = await fetch("/api/pos/productos/importar", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error ?? "Error al importar");
        return;
      }
      setResultado(json.data);
      toast.success(`Importación completada: ${json.data.creados} creados, ${json.data.actualizados} actualizados`);
      onImportado();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Importar catálogo" tamano="lg">
      <div className="space-y-4">
        <p className="text-sm text-texto-suave">
          Sube un archivo <strong>.xlsx</strong> o <strong>.csv</strong> con columnas: nombre, código de barras, departamento, unidad,
          precio costo, precio venta, precio mayoreo, existencia, existencia mínima. Solo el nombre es obligatorio: si el producto
          ya existe (se busca por código de barras o nombre), las columnas que dejes vacías no se modifican — por ejemplo, puedes
          subir solo nombre + existencia para actualizar el conteo de inventario sin tocar los precios. Los productos nuevos sí
          necesitan precio costo y precio venta.
        </p>

        <div
          {...getRootProps()}
          className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-marca bg-marca-suave" : "border-borde hover:bg-surface-hover"
          }`}
        >
          <input {...getInputProps()} />
          {archivo ? (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-marca" />
              <p className="text-sm font-medium">{archivo.name}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-texto-suave">
              <UploadCloud className="h-8 w-8" />
              <p className="text-sm">Arrastra tu archivo aquí o haz clic para seleccionarlo</p>
            </div>
          )}
        </div>

        {resultado && (
          <div className="rounded-xl bg-surface-hover p-3 text-sm space-y-1">
            <p>Filas procesadas: {resultado.total}</p>
            <p className="text-exito">Creados: {resultado.creados} · Actualizados: {resultado.actualizados}</p>
            {resultado.errores.length > 0 && (
              <div className="text-peligro">
                <p>{resultado.errores.length} errores:</p>
                <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                  {resultado.errores.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Boton type="button" variante="secundario" className="flex-1" onClick={onCerrar}>Cerrar</Boton>
          <Boton type="button" variante="primario" className="flex-1" disabled={!archivo} cargando={cargando} onClick={importar}>
            Importar
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
