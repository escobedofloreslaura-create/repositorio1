import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { TemaProveedor } from "@/components/layout/tema-proveedor";
import { obtenerSesion } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LEF PATRIMONIAL — CRM",
    template: "%s · LEF PATRIMONIAL",
  },
  description:
    "Asesoría personalizada en Planes de Retiro, Gastos Médicos Mayores, Seguros de Vida, Educativos, Ahorro e Inversiones.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "LEF PATRIMONIAL — Agenda tu cita",
    description:
      "Protege lo que más importa. Planes de Retiro, GMM, Vida, Educativo y más. Agenda tu cita ahora.",
    type: "website",
    locale: "es_MX",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LEF PATRIMONIAL",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await obtenerSesion();
  const tema = sesion?.temaPreferido ?? "sistema";

  return (
    <html
      lang="es"
      className={`${geistSans.variable} h-full`}
      data-tema={tema === "sistema" ? undefined : tema}
      suppressHydrationWarning
    >
      <head>
        {/* Anti-parpadeo de tema: aplica antes de pintar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var t = localStorage.getItem('crm_tema') || 'sistema';
                if(t === 'oscuro') document.documentElement.setAttribute('data-tema','oscuro');
                else if(t === 'claro') document.documentElement.setAttribute('data-tema','claro');
              } catch(e){}
            })()`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-fondo text-texto antialiased">
        <TemaProveedor tema={tema}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--surface)",
                color: "var(--texto)",
                border: "1px solid var(--borde)",
                borderRadius: "12px",
                fontSize: "14px",
                boxShadow: "var(--sombra)",
              },
            }}
          />
        </TemaProveedor>
      </body>
    </html>
  );
}
