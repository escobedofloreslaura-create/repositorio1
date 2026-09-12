import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db", authToken: process.env.TURSO_AUTH_TOKEN });
const prisma = new PrismaClient({ adapter });

const DEPARTAMENTOS = ["Vinos y Licores", "Refrescos y Varios", "Dulcería", "Cervezas"];

async function main() {
  console.log("🍷 Sembrando módulo de Punto de Venta (Vinos y Licores) — multi-sucursal...");

  await prisma.posTraspaso.deleteMany();
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
  await prisma.posExistencia.deleteMany();
  await prisma.posProducto.deleteMany();
  await prisma.posDepartamento.deleteMany();
  await prisma.posSesionToken.deleteMany();
  await prisma.posUsuario.deleteMany();
  await prisma.posConfiguracion.deleteMany();
  await prisma.posSucursal.deleteMany();

  const sucursalCentro = await prisma.posSucursal.create({
    data: { nombre: "Sucursal Centro", direccion: "Calle 5 de Mayo 12, Centro", telefono: "222 111 2233" },
  });
  const sucursalNorte = await prisma.posSucursal.create({
    data: { nombre: "Sucursal Norte", direccion: "Av. Reforma 200, Norte", telefono: "222 333 4455" },
  });
  console.log("✅ Sucursales creadas");

  await prisma.posConfiguracion.create({
    data: {
      sucursalId: sucursalCentro.id,
      nombreNegocio: "Vinos y Licores El Buen Trago - Centro",
      direccion: sucursalCentro.direccion,
      telefono: sucursalCentro.telefono,
      mensajeTicket: "¡Gracias por su compra! Tome con moderación.",
    },
  });
  await prisma.posConfiguracion.create({
    data: {
      sucursalId: sucursalNorte.id,
      nombreNegocio: "Vinos y Licores El Buen Trago - Norte",
      direccion: sucursalNorte.direccion,
      telefono: sucursalNorte.telefono,
      mensajeTicket: "¡Gracias por su compra! Tome con moderación.",
    },
  });
  console.log("✅ Configuración por sucursal creada");

  const departamentos = await Promise.all(
    DEPARTAMENTOS.map((nombre, orden) => prisma.posDepartamento.create({ data: { nombre, orden } }))
  );
  console.log("✅ Departamentos creados (catálogo compartido)");

  const hashAdmin = await bcrypt.hash("admin123", 12);
  const hashCajero = await bcrypt.hash("cajero123", 12);

  await prisma.posUsuario.create({
    data: { nombre: "Laura Escobedo", usuario: "admin", contrasenaHash: hashAdmin, rol: "ADMINISTRADOR", sucursalId: null },
  });
  await prisma.posUsuario.create({
    data: { nombre: "Gerente Centro", usuario: "admincentro", contrasenaHash: hashAdmin, rol: "ADMINISTRADOR", sucursalId: sucursalCentro.id },
  });
  await prisma.posUsuario.create({
    data: { nombre: "Cajero Centro 1", usuario: "cajero1", contrasenaHash: hashCajero, rol: "CAJERO", sucursalId: sucursalCentro.id },
  });
  await prisma.posUsuario.create({
    data: { nombre: "Gerente Norte", usuario: "adminnorte", contrasenaHash: hashAdmin, rol: "ADMINISTRADOR", sucursalId: sucursalNorte.id },
  });
  await prisma.posUsuario.create({
    data: { nombre: "Cajero Norte 1", usuario: "cajero2", contrasenaHash: hashCajero, rol: "CAJERO", sucursalId: sucursalNorte.id },
  });
  console.log("✅ Usuarios creados (1 Administrador General + 2 sucursales)");

  const [vinos, refrescos, dulces, cervezas] = departamentos;

  const productos = [
    { nombre: "Tequila José Cuervo Especial 750ml", departamentoId: vinos.id, precioCosto: 180, precioVenta: 260, precioMayoreo: 235, centro: 24, norte: 10 },
    { nombre: "Ron Bacardí Blanco 750ml", departamentoId: vinos.id, precioCosto: 150, precioVenta: 220, precioMayoreo: 200, centro: 18, norte: 14 },
    { nombre: "Whisky Buchanan's Deluxe 750ml", departamentoId: vinos.id, precioCosto: 320, precioVenta: 450, precioMayoreo: 420, centro: 3, centroMin: 5, norte: 6, norteMin: 5 },
    { nombre: "Vino Tinto Casa Madero 750ml", departamentoId: vinos.id, precioCosto: 140, precioVenta: 199, precioMayoreo: 180, centro: 12, norte: 8 },
    { nombre: "Vodka Absolut 750ml", departamentoId: vinos.id, precioCosto: 160, precioVenta: 230, precioMayoreo: 210, centro: 15, norte: 9 },
    { nombre: "Coca-Cola 600ml", departamentoId: refrescos.id, precioCosto: 10, precioVenta: 18, precioMayoreo: 15, centro: 96, norte: 72, unidad: "PIEZA" },
    { nombre: "Agua Mineral Topo Chico 355ml", departamentoId: refrescos.id, precioCosto: 8, precioVenta: 15, precioMayoreo: 12, centro: 60, norte: 40 },
    { nombre: "Sabritas Original 45g", departamentoId: refrescos.id, precioCosto: 9, precioVenta: 16, precioMayoreo: null, centro: 40, norte: 30 },
    { nombre: "Chicles Trident", departamentoId: dulces.id, precioCosto: 5, precioVenta: 10, precioMayoreo: null, centro: 4, centroMin: 10, norte: 20, norteMin: 10 },
    { nombre: "Paleta Payaso", departamentoId: dulces.id, precioCosto: 2, precioVenta: 5, precioMayoreo: null, centro: 80, norte: 60 },
    { nombre: "Cerveza Corona 355ml", departamentoId: cervezas.id, precioCosto: 12, precioVenta: 22, precioMayoreo: 18, centro: 120, norte: 90 },
    { nombre: "Cerveza Modelo Especial 355ml", departamentoId: cervezas.id, precioCosto: 13, precioVenta: 23, precioMayoreo: 19, centro: 100, norte: 85 },
    { nombre: "Caguama Victoria 940ml", departamentoId: cervezas.id, unidad: "CAJA", precioCosto: 22, precioVenta: 35, precioMayoreo: 30, centro: 30, norte: 15 },
  ];

  for (const p of productos) {
    const producto = await prisma.posProducto.create({
      data: {
        nombre: p.nombre,
        departamentoId: p.departamentoId,
        unidad: p.unidad ?? "PIEZA",
        precioCosto: p.precioCosto,
        precioVenta: p.precioVenta,
        precioMayoreo: p.precioMayoreo ?? null,
      },
    });
    await prisma.posExistencia.create({
      data: { sucursalId: sucursalCentro.id, productoId: producto.id, existencia: p.centro, existenciaMinima: p.centroMin ?? 5 },
    });
    await prisma.posExistencia.create({
      data: { sucursalId: sucursalNorte.id, productoId: producto.id, existencia: p.norte, existenciaMinima: p.norteMin ?? 5 },
    });
  }
  console.log(`✅ ${productos.length} productos creados en el catálogo compartido, con existencias por sucursal`);

  await prisma.posCliente.create({
    data: { nombre: "Don Chuy Abarrotes", telefono: "222 111 2233", direccion: "Calle 5 de Mayo 12", limiteCredito: 3000, sucursalId: sucursalCentro.id },
  });
  await prisma.posCliente.create({
    data: { nombre: "Restaurante La Terraza", telefono: "222 333 4455", direccion: "Av. Reforma 200", limiteCredito: 5000, tipoPrecio: "CLIENTE_FRECUENTE", sucursalId: sucursalNorte.id },
  });
  console.log("✅ Clientes de crédito creados (uno por sucursal)");

  console.log("\n🎉 ¡Seed del POS multi-sucursal completado!");
  console.log("👤 Administrador General: admin / admin123 (sin sucursal fija, puede elegir cualquiera)");
  console.log("👤 Admin Sucursal Centro: admincentro / admin123");
  console.log("👤 Cajero Sucursal Centro: cajero1 / cajero123");
  console.log("👤 Admin Sucursal Norte: adminnorte / admin123");
  console.log("👤 Cajero Sucursal Norte: cajero2 / cajero123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
