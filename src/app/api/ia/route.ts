import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesion } from "@/lib/auth";

type AccionIA = "mensaje" | "temperatura" | "accion" | "resumen" | "objecion";

function generarPromptLocal(accion: AccionIA, cliente: Record<string, unknown>): string {
  const nombre = String(cliente.nombre ?? "el cliente");
  const etapa = String(cliente.etapa ?? "PROSPECTO");
  const temperatura = String(cliente.temperatura ?? "FRIO");
  const objecion = String(cliente.objecionPrincipal ?? "precio");

  const prompts: Record<AccionIA, string> = {
    mensaje: `Hola ${nombre}, espero que estés muy bien. Me gustaría platicar contigo sobre las opciones patrimoniales que tenemos disponibles para ti. ¿Tienes unos minutos esta semana para una llamada rápida?`,
    temperatura: `Basándome en la etapa actual (${etapa}) y el comportamiento del prospecto ${nombre}, la temperatura recomendada es ${temperatura === "FRIO" ? "TIBIO - hay señales de interés que pueden desarrollarse" : temperatura === "TIBIO" ? "CALIENTE - el prospecto muestra interés activo" : "CALIENTE - mantener el momentum y cerrar pronto"}.`,
    accion: `Para ${nombre} en etapa ${etapa}, la siguiente acción recomendada es: ${
      etapa === "PROSPECTO" ? "Realizar llamada de introducción de 15 minutos para identificar necesidades" :
      etapa === "CONTACTADO" ? "Enviar propuesta inicial personalizada según las necesidades identificadas" :
      etapa === "PROPUESTA" ? "Dar seguimiento a la propuesta enviada y resolver dudas" :
      etapa === "NEGOCIACION" ? "Programar reunión de cierre con beneficios finales" :
      "Formalizar la documentación y onboarding del cliente"
    }.`,
    resumen: `Resumen del cliente ${nombre}: Se encuentra en etapa ${etapa} con temperatura ${temperatura}. ${
      cliente.empresaNombre ? `Trabaja en ${cliente.empresaNombre}.` : ""
    } ${cliente.notas ? `Notas: ${String(cliente.notas).slice(0, 200)}.` : ""} ${
      cliente.proximaAccion ? `Próxima acción: ${cliente.proximaAccion}.` : ""
    }`,
    objecion: `Para manejar la objeción de "${objecion}" con ${nombre}, te recomiendo: ${
      objecion === "precio" ? "Enfocarte en el valor a largo plazo y el retorno de inversión. Pregunta: '¿Cuánto le cuesta no tener esta protección?'" :
      objecion === "tiempo" ? "Ofrecer un proceso simplificado. Menciona que la documentación toma menos de 30 minutos." :
      objecion === "ya_tiene" ? "Realizar un análisis comparativo gratuito para identificar brechas en su cobertura actual." :
      "Escuchar activamente, validar su preocupación y presentar casos de éxito similares."
    }`,
  };

  return prompts[accion] ?? "No se pudo generar una respuesta para esta acción.";
}

async function llamarAnthropic(prompt: string, contextoCliente: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system:
        "Eres un asistente experto en ventas patrimoniales para la empresa LEF PATRIMONIAL. Ayudas a los vendedores a gestionar sus prospectos de manera efectiva. Responde siempre en español, de forma concisa y práctica. Máximo 3 párrafos.",
      messages: [
        {
          role: "user",
          content: `Contexto del cliente:\n${contextoCliente}\n\nTarea: ${prompt}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "No se pudo generar respuesta.";
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const body = await req.json();
    const accion = body.accion as AccionIA;
    const clienteId = body.clienteId as string;

    const accionesValidas: AccionIA[] = ["mensaje", "temperatura", "accion", "resumen", "objecion"];
    if (!accionesValidas.includes(accion)) {
      return NextResponse.json({ ok: false, error: "Acción inválida" }, { status: 400 });
    }

    if (!clienteId) {
      return NextResponse.json({ ok: false, error: "clienteId requerido" }, { status: 400 });
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        eliminadoEn: null,
        ...(sesion.rol === "VENDEDOR" ? { vendedorId: sesion.id } : {}),
      },
      include: {
        vendedor: { select: { nombre: true } },
        etiquetasCliente: { include: { etiqueta: true } },
      },
    });

    if (!cliente) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });

    const promptsIA: Record<AccionIA, string> = {
      mensaje: `Redacta un mensaje de WhatsApp personalizado y natural para contactar a este prospecto. Debe ser cálido, profesional y no intrusivo.`,
      temperatura: `Analiza la temperatura del prospecto (FRIO/TIBIO/CALIENTE) basándote en su etapa, última interacción y datos disponibles. Justifica brevemente tu evaluación y da recomendaciones.`,
      accion: `Recomienda la próxima acción más efectiva para avanzar a este prospecto en el embudo de ventas. Sé específico con tiempo y canal de comunicación.`,
      resumen: `Genera un resumen ejecutivo del prospecto para que un vendedor pueda prepararse para la siguiente interacción.`,
      objecion: `Proporciona estrategias específicas para superar la objeción principal de este prospecto. Incluye frases de ejemplo.`,
    };

    const contextoCliente = `
Nombre: ${cliente.nombre}
Teléfono: ${cliente.telefono}
Correo: ${cliente.correo ?? "N/A"}
Etapa: ${cliente.etapa}
Estado: ${cliente.estado}
Temperatura: ${cliente.temperatura ?? "No definida"}
Origen: ${cliente.origen ?? "N/A"}
Objeción principal: ${cliente.objecionPrincipal ?? "N/A"}
Valor estimado: ${cliente.valorEstimado ? `$${cliente.valorEstimado}` : "N/A"}
Empresa: ${cliente.empresaNombre ?? "N/A"}
Puesto: ${cliente.empresaPuesto ?? "N/A"}
Productos de interés: ${cliente.productosInteres ?? "N/A"}
Notas: ${cliente.notas ? String(cliente.notas).slice(0, 300) : "N/A"}
Próxima acción: ${cliente.proximaAccion ?? "N/A"}
Último contacto: ${cliente.ultimoContactoEn?.toLocaleDateString("es-MX") ?? "N/A"}
Etiquetas: ${cliente.etiquetasCliente.map((e) => e.etiqueta.nombre).join(", ") || "Ninguna"}
    `.trim();

    let respuesta: string;

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        respuesta = await llamarAnthropic(promptsIA[accion], contextoCliente);
      } catch (apiError) {
        console.error("Error llamando Anthropic, usando template local:", apiError);
        respuesta = generarPromptLocal(accion, cliente as Record<string, unknown>);
      }
    } else {
      respuesta = generarPromptLocal(accion, cliente as Record<string, unknown>);
    }

    return NextResponse.json({ ok: true, data: { respuesta, accion, clienteId } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Error al procesar solicitud de IA" }, { status: 500 });
  }
}
