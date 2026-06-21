import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Sembrando base de datos LEF PATRIMONIAL...");

  // Limpiar datos previos
  await prisma.historialAccion.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.etiquetaCliente.deleteMany();
  await prisma.etiqueta.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.sesionToken.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.plantillaMensaje.deleteMany();
  await prisma.configNegocio.deleteMany();
  await prisma.contadorFolio.deleteMany();

  // Configuración del negocio
  await prisma.configNegocio.create({
    data: {
      id: "principal",
      nombre: "LEF PATRIMONIAL",
      metaMensualDinero: 100000,
      metaMensualClientes: 10,
      mensajeWhatsApp: "Hola {nombre}, soy de LEF PATRIMONIAL. ¿Te late si agendamos una llamada para platicar sobre cómo proteger tu patrimonio?",
    },
  });

  // Contador de folios
  await prisma.contadorFolio.create({ data: { id: "pagos", ultimo: 0 } });

  // Usuarios
  const hashAdmin = await bcrypt.hash("admin123", 12);
  const hashVendedor = await bcrypt.hash("vendedor123", 12);

  const admin = await prisma.usuario.create({
    data: {
      nombre: "Laura Escobedo",
      correo: "laura@lefpatrimonial.com",
      contrasenaHash: hashAdmin,
      rol: "ADMIN",
      paginaAgendaSlug: "laura",
    },
  });

  const vendedor = await prisma.usuario.create({
    data: {
      nombre: "Carlos Flores",
      correo: "carlos@lefpatrimonial.com",
      contrasenaHash: hashVendedor,
      rol: "VENDEDOR",
      paginaAgendaSlug: "carlos",
    },
  });

  console.log("✅ Usuarios creados");

  // Etiquetas
  const etiquetas = await Promise.all([
    prisma.etiqueta.create({ data: { nombre: "Referido", color: "#10b981" } }),
    prisma.etiqueta.create({ data: { nombre: "VIP", color: "#f59e0b" } }),
    prisma.etiqueta.create({ data: { nombre: "Empresario", color: "#6366f1" } }),
    prisma.etiqueta.create({ data: { nombre: "Joven", color: "#ec4899" } }),
  ]);

  console.log("✅ Etiquetas creadas");

  // Plantillas de mensajes
  await Promise.all([
    prisma.plantillaMensaje.create({
      data: {
        nombre: "Primer contacto",
        tipo: "whatsapp",
        cuerpo: "Hola {nombre} 👋, soy de LEF PATRIMONIAL. Me puse en contacto porque creo que podemos ayudarte a proteger tu patrimonio y el de tu familia. ¿Tienes 15 minutos para platicar esta semana?",
        esSistema: true,
      },
    }),
    prisma.plantillaMensaje.create({
      data: {
        nombre: "Seguimiento propuesta",
        tipo: "whatsapp",
        cuerpo: "Hola {nombre}, quería dar seguimiento a la propuesta que te envié. ¿Tuviste oportunidad de revisarla? Con gusto aclaro cualquier duda que tengas 😊",
        esSistema: true,
      },
    }),
    prisma.plantillaMensaje.create({
      data: {
        nombre: "Cierre de venta",
        tipo: "whatsapp",
        cuerpo: "Hola {nombre}, me da mucho gusto haberte podido ayudar. Tu póliza ya está activa y cualquier duda o trámite que necesites, aquí estoy. ¡Bienvenido a la familia LEF PATRIMONIAL! 🎉",
        esSistema: true,
      },
    }),
    prisma.plantillaMensaje.create({
      data: {
        nombre: "Recordatorio de cita",
        tipo: "whatsapp",
        cuerpo: "Hola {nombre}, te recuerdo que mañana tenemos nuestra cita programada. ¿Confirmamos? Si necesitas cambiar el horario, con gusto lo acomodamos.",
        esSistema: true,
      },
    }),
  ]);

  console.log("✅ Plantillas creadas");

  // Clientes de muestra
  const etapas = ["Nuevo", "Contactado", "Reunión agendada", "Propuesta enviada", "Seguimiento", "Negociación"];
  const temperaturas = ["Frio", "Tibio", "Caliente"];
  const objeciones = ["Precio", "Tiempo", "Ya tiene seguro", "No le interesa ahora", null];

  const clientesData = [
    { nombre: "Roberto Hernández", telefono: "+52 222 100 1001", correo: "roberto@empresa.com", etapa: "Negociación", temperatura: "Caliente", valorEstimado: 85000, origen: "Referido", objecionPrincipal: "Precio", empresaNombre: "Constructora HM", empresaPuesto: "Director" },
    { nombre: "Sofía Martínez", telefono: "+52 222 100 1002", correo: "sofia@gmail.com", etapa: "Propuesta enviada", temperatura: "Tibio", valorEstimado: 45000, origen: "Facebook", objecionPrincipal: "Tiempo" },
    { nombre: "Eduardo López", telefono: "+52 222 100 1003", etapa: "Reunión agendada", temperatura: "Caliente", valorEstimado: 120000, origen: "Referido", empresaNombre: "Grupo Alfa", empresaPuesto: "Socio" },
    { nombre: "María González", telefono: "+52 222 100 1004", correo: "maria.g@correo.com", etapa: "Contactado", temperatura: "Tibio", valorEstimado: 30000, origen: "Instagram" },
    { nombre: "Fernando Ramos", telefono: "+52 222 100 1005", etapa: "Seguimiento", temperatura: "Frio", valorEstimado: 55000, origen: "Google", objecionPrincipal: "Ya tiene seguro" },
    { nombre: "Andrea Vega", telefono: "+52 222 100 1006", correo: "andrea@negocio.mx", etapa: "Nuevo", temperatura: "Caliente", valorEstimado: 200000, origen: "Referido", empresaNombre: "Restaurantes Vega", empresaPuesto: "Propietaria" },
    { nombre: "Luis Castillo", telefono: "+52 222 100 1007", etapa: "Propuesta enviada", temperatura: "Tibio", valorEstimado: 40000, origen: "WhatsApp" },
    { nombre: "Gabriela Torres", telefono: "+52 222 100 1008", correo: "gaby.torres@email.com", etapa: "Contactado", temperatura: "Frio", valorEstimado: 25000, origen: "Facebook", objecionPrincipal: "No le interesa ahora" },
    { nombre: "Ricardo Morales", telefono: "+52 222 100 1009", etapa: "Reunión agendada", temperatura: "Caliente", valorEstimado: 150000, origen: "Referido", empresaNombre: "Morales e Hijos", empresaPuesto: "CEO" },
    { nombre: "Patricia Jiménez", telefono: "+52 222 100 1010", correo: "patricia@empresa.com", etapa: "Seguimiento", temperatura: "Tibio", valorEstimado: 65000, origen: "Google" },
  ];

  const clientes = [];
  for (const [i, data] of clientesData.entries()) {
    const haceNDias = new Date(Date.now() - (i * 5 + Math.floor(Math.random() * 10)) * 24 * 60 * 60 * 1000);
    const cliente = await prisma.cliente.create({
      data: {
        ...data,
        vendedorId: i % 3 === 0 ? vendedor.id : admin.id,
        proximaAccion: i % 3 === 0 ? "Llamar para seguimiento" : i % 2 === 0 ? "Enviar propuesta" : undefined,
        proximaAccionFecha: i % 2 === 0 ? new Date(Date.now() + (i + 1) * 2 * 24 * 60 * 60 * 1000) : undefined,
        ultimoContactoEn: haceNDias,
        creadoEn: haceNDias,
      },
    });
    clientes.push(cliente);

    // Historial
    await prisma.historialAccion.create({
      data: {
        clienteId: cliente.id,
        usuarioId: admin.id,
        tipo: "CREACION",
        descripcion: `Cliente creado: ${cliente.nombre}`,
        fecha: haceNDias,
      },
    });
  }

  console.log("✅ 10 clientes de muestra creados");

  // Clientes GANADOS con pagos
  const clientesGanados = [
    { nombre: "Ana Pérez", telefono: "+52 222 200 2001", etapa: "Renovaciones o seguimiento a pagos", estado: "GANADO", temperatura: "Caliente", valorEstimado: 75000 },
    { nombre: "Miguel Sánchez", telefono: "+52 222 200 2002", etapa: "Renovaciones o seguimiento a pagos", estado: "GANADO", temperatura: "Caliente", valorEstimado: 55000 },
  ];

  for (const data of clientesGanados) {
    const hace = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const cliente = await prisma.cliente.create({
      data: { ...data, vendedorId: admin.id, creadoEn: hace },
    });
    await prisma.pago.create({
      data: {
        clienteId: cliente.id,
        monto: data.valorEstimado!,
        metodo: "transferencia",
        estatus: "pagado",
        concepto: "Póliza de vida y GMM",
        fechaPago: hace,
        folio: 1,
      },
    });
  }

  // Cliente PERDIDO
  await prisma.cliente.create({
    data: {
      nombre: "Jorge Medina",
      telefono: "+52 222 300 3001",
      etapa: "Propuesta enviada",
      estado: "PERDIDO",
      temperatura: "Frio",
      motivoPerdida: "Se fue con la competencia",
      vendedorId: vendedor.id,
    },
  });

  console.log("✅ Clientes ganados y perdidos creados");

  // Historial de 6 meses para dashboard
  for (let m = 5; m >= 0; m--) {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - m);
    fecha.setDate(15);

    const clientesMes = await prisma.cliente.findMany({
      where: { estado: "GANADO" },
      take: 2,
    });

    for (const c of clientesMes) {
      await prisma.historialAccion.create({
        data: {
          clienteId: c.id,
          usuarioId: admin.id,
          tipo: "CAMBIO_ESTADO",
          descripcion: `Estado cambiado a GANADO`,
          fecha,
          metadatos: JSON.stringify({ estadoAnterior: "ACTIVO", estadoNuevo: "GANADO" }),
        },
      });
    }
  }

  console.log("✅ Historial de 6 meses generado");
  console.log("\n🎉 ¡Seed completado!");
  console.log("📧 Admin: laura@lefpatrimonial.com / admin123");
  console.log("📧 Vendedor: carlos@lefpatrimonial.com / vendedor123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
