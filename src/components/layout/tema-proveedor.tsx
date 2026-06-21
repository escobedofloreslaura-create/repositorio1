"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Tema = "claro" | "oscuro" | "sistema";

interface TemaCtx {
  tema: Tema;
  cambiarTema: (t: Tema) => void;
}

const CtxTema = createContext<TemaCtx>({
  tema: "sistema",
  cambiarTema: () => {},
});

export function TemaProveedor({
  children,
  tema: temaInicial,
}: {
  children: React.ReactNode;
  tema: string;
}) {
  const [tema, setTema] = useState<Tema>((temaInicial as Tema) || "sistema");

  useEffect(() => {
    const guardado = localStorage.getItem("crm_tema") as Tema | null;
    if (guardado) setTema(guardado);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (tema === "oscuro") {
      html.setAttribute("data-tema", "oscuro");
    } else if (tema === "claro") {
      html.setAttribute("data-tema", "claro");
    } else {
      html.removeAttribute("data-tema");
    }
    localStorage.setItem("crm_tema", tema);
    // Guardar en DB si está disponible
    fetch("/api/usuarios/tema", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tema }),
    }).catch(() => {});
  }, [tema]);

  return (
    <CtxTema.Provider value={{ tema, cambiarTema: setTema }}>
      {children}
    </CtxTema.Provider>
  );
}

export function useTema() {
  return useContext(CtxTema);
}
