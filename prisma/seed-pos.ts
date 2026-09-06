import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db", authToken: process.env.TURSO_AUTH_TOKEN });
const prisma = new PrismaClient({ adapter });

const DEPARTAMENTOS = ["Vinos y Licores", "Refrescos y Varios", "Dulcería", "Cervezas"];

async function main() {
  console.log("🍷 Sembrando módulo de Punto de Venta (Vinos y Licores)...");

  await prisma.posMovimientoInventario.deleteMany();
  await prisma.posDevolucion.deleteMany();
  await prisma.posPagoVenta.deleteMany();
  await prisma.posDetalleVenta.deleteMany();
  await prisma.posVenta.deleteMany();
  await prisma.posMovimientoCaja.deleteMany();
  await prisma.posCorteCaja.deleteMany();
  await prisma.posTurno.deleteMany();
  await prisma.posContadorFolio.deleteMany();
  await prisma.posCliente.deleteMany();
  await prisma.posProducto.deleteMany();
  await prisma.posDepartamento.deleteMany();
  await prisma.posSesionToken.deleteMany();
  await prisma.posUsuario.deleteMany();
  await prisma.posConfiguracion.deleteMany();

  await prisma.posConfiguracion.create({
    data: { id: "principal", nombreNegocio: "Vinos y Licores El Buen Trago", mensajeTicket: "¡Gracias por su compra! Tome con moderación." },
  });

  const departamentos = await Promise.all(
    DEPARTAMENTOS.map((nombre, orden) => prisma.posDepartamento.create({ data: { nombre, orden } }))
  );
  console.log("✅ Departamentos creados");

  const hashAdmin = await bcrypt.hash("admin123", 12);
  const hashCajero = await bcrypt.hash("cajero123", 12);

  await prisma.posUsuario.create({ data: { nombre: "Laura Escobedo", usuario: "admin", contrasenaHash: hashAdmin, rol: "ADMINISTRADOR" } });
  await prisma.posUsuario.create({ data: { nombre: "Gerente Turno 2", usuario: "admin2", contrasenaHash: hashAdmin, rol: "ADMINISTRADOR" } });
  await prisma.posUsuario.create({ data: { nombre: "Cajero 1", usuario: "cajero1", contrasenaHash: hashCajero, rol: "CAJERO" } });
  await prisma.posUsuario.create({ data: { nombre: "Cajero 2", usuario: "cajero2", contrasenaHash: hashCajero, rol: "CAJERO" } });
  console.log("✅ Usuarios creados");

  const [vinos, refrescos, dulces, cervezas] = departamentos;

  const productos = [
    { nombre: "Tequila José Cuervo Especial 750ml", departamentoId: vinos.id, precioCosto: 180, precioVenta: 260, precioMayoreo: 235, existencia: 24 },
    { nombre: "Ron Bacardí Blanco 750ml", departamentoId: vinos.id, precioCosto: 150, precioVenta: 220, precioMayoreo: 200, existencia: 18 },
    { nombre: "Whisky Buchanan's Deluxe 750ml", departamentoId: vinos.id, precioCosto: 320, precioVenta: 450, precioMayoreo: 420, existencia: 3, existenciaMinima: 5 },
    { nombre: "Vino Tinto Casa Madero 750ml", departamentoId: vinos.id, precioCosto: 140, precioVenta: 199, precioMayoreo: 180, existencia: 12 },
    { nombre: "Vodka Absolut 750ml", departamentoId: vinos.id, precioCosto: 160, precioVenta: 230, precioMayoreo: 210, existencia: 15 },
    { nombre: "Coca-Cola 600ml", departamentoId: refrescos.id, precioCosto: 10, precioVenta: 18, precioMayoreo: 15, existencia: 96, unidad: "PIEZA" },
    { nombre: "Agua Mineral Topo Chico 355ml", departamentoId: refrescos.id, precioCosto: 8, precioVenta: 15, precioMayoreo: 12, existencia: 60 },
    { nombre: "Sabritas Original 45g", departamentoId: refrescos.id, precioCosto: 9, precioVenta: 16, precioMayoreo: null, existencia: 40 },
    { nombre: "Chicles Trident", departamentoId: dulces.id, precioCosto: 5, precioVenta: 10, precioMayoreo: null, existencia: 4, existenciaMinima: 10 },
    { nombre: "Paleta Payaso", departamentoId: dulces.id, precioCosto: 2, precioVenta: 5, precioMayoreo: null, existencia: 80 },
    { nombre: "Cerveza Corona 355ml", departamentoId: cervezas.id, precioCosto: 12, precioVenta: 22, precioMayoreo: 18, existencia: 120 },
    { nombre: "Cerveza Modelo Especial 355ml", departamentoId: cervezas.id, precioCosto: 13, precioVenta: 23, precioMayoreo: 19, existencia: 100 },
    { nombre: "Caguama Victoria 940ml", departamentoId: cervezas.id, unidad: "CAJA", precioCosto: 22, precioVenta: 35, precioMayoreo: 30, existencia: 30 },
  ];

  for (const p of productos) {
    await prisma.posProducto.create({
      data: {
        nombre: p.nombre,
        departamentoId: p.departamentoId,
        unidad: p.unidad ?? "PIEZA",
        precioCosto: p.precioCosto,
        precioVenta: p.precioVenta,
        precioMayoreo: p.precioMayoreo ?? null,
        existencia: p.existencia,
        existenciaMinima: p.existenciaMinima ?? 5,
      },
    });
  }
  console.log(`✅ ${productos.length} productos creados`);

  await prisma.posCliente.create({ data: { nombre: "Don Chuy Abarrotes", telefono: "222 111 2233", direccion: "Calle 5 de Mayo 12", limiteCredito: 3000 } });
  await prisma.posCliente.create({ data: { nombre: "Restaurante La Terraza", telefono: "222 333 4455", direccion: "Av. Reforma 200", limiteCredito: 5000 } });
  console.log("✅ Clientes de crédito creados");

  console.log("\n🎉 ¡Seed del POS completado!");
  console.log("👤 Admin: admin / admin123");
  console.log("👤 Cajero: cajero1 / cajero123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
