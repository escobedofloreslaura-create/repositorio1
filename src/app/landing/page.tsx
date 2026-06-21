import { Metadata } from "next";
import { LandingForm } from "@/components/landing/landing-form";

export const metadata: Metadata = {
  title: "LEF PATRIMONIAL — Asesoría Patrimonial y Seguros",
  description: "Protege tu patrimonio y el de tu familia. Agenda una consulta gratuita con nuestros expertos en Puebla.",
};

export default function LandingPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 flex flex-col">
      <header className="p-6 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">LEF PATRIMONIAL</p>
            <p className="text-indigo-300 text-xs">Asesoría patrimonial · Puebla</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-indigo-200 text-sm font-medium">
              ✨ Consulta gratuita · Sin compromiso
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Protege lo que más<br />
              <span className="text-indigo-300">importa</span>
            </h1>
            <p className="text-indigo-200 text-lg leading-relaxed">
              Asesoría patrimonial personalizada, seguros de vida, gastos médicos, ahorro e inversión.
              Llevamos 10+ años ayudando a familias en Puebla a construir un futuro seguro.
            </p>
            <div className="space-y-3">
              {["🛡️ Seguros de vida y gastos médicos", "💰 Planes de ahorro e inversión", "🏠 Protección patrimonial", "📊 Análisis financiero personal"].map((b) => (
                <div key={b} className="flex items-center gap-3 text-indigo-200 text-sm">{b}</div>
              ))}
            </div>
          </div>
          <div>
            <LandingForm />
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-indigo-400 text-xs">
        © 2025 LEF PATRIMONIAL · Puebla, México · Todos los derechos reservados
      </footer>
    </main>
  );
}
