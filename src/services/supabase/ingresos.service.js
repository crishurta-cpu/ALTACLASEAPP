import { supabase } from "./client";
import { findOrCreate as findOrCreateCustomer } from "./customers.service";
import { findOrCreate as findOrCreateSupplier } from "./suppliers.service";
import { findOrCreate as findOrCreateProduct } from "./products.service";

/**
 * Reemplaza services/sheets/ingresos.service.js (Fase M5, cutover).
 *
 * En Sheets, INGRESOS era una sola hoja con 5 TIPOS mezclados (ver
 * docs/SUPABASE_MIGRATION_ROADMAP.md, Fase M3): VENTA/COMPRA CON SALDO viven
 * en `orders`+`order_items`, COMISION/OCASIONALES en `other_income`, y
 * RECIBIDO CLIENTE son abonos en `payments`. Este servicio fusiona los tres
 * en un solo `readAll` con el mismo shape de negocio que ya consume toda la
 * UI (Home, Historial, Clientes, etc.), para no tener que tocar esas
 * pantallas en el cutover.
 *
 * `other_income.type = 'loan'` (prestamos personales, Fase Personal/Deuda
 * Valen) se EXCLUYE a propósito de este feed: tiene su pantalla dedicada,
 * ver personalLoans.service.js.
 */

const AUTO_PAYMENT_METHOD = "sale"; // pago automatico al crear una venta ya cobrada (debe=NO)
const ABONO_PAYMENT_METHOD = "abono"; // abono manual posterior (TIPO=RECIBIDO CLIENTE)

function ordersToIngresos(orders) {
  return orders.map((o) => {
    const item = (o.order_items && o.order_items[0]) || {};
    const costo = Number(item.actual_cost) || 0;
    const pv = Number(item.sale_price) || 0;
    const ganancia = pv - costo;
    const pagado = (o.payments || []).reduce((s, p) => s + Number(p.amount), 0);
    return {
      id: "ord_" + o.id,
      _row: "ord:" + o.id,
      fecha: o.order_date,
      // sale_type solo admite 'normal'/'occasional' — COMPRA CON SALDO se
      // marca en notes (ver createOrder), no en sale_type.
      tipo: o.notes === "Compra con saldo (cliente especial)" ? "COMPRA CON SALDO" : "VENTA",
      producto: item.products?.name || "",
      cliente: o.customers?.name || "",
      proveedor: item.suppliers?.name || "",
      costo,
      precioVenta: pv,
      debe: pagado + 0.01 < pv ? "SI" : "NO",
      ganancia,
      margen: pv > 0 ? Math.round((ganancia / pv) * 100) + "%" : "0%",
    };
  });
}

function otherIncomeToIngresos(rows) {
  return rows.map((r) => ({
    id: "oi_" + r.id,
    _row: "oi:" + r.id,
    fecha: r.income_date,
    tipo: r.type === "commission" ? "COMISION" : "OCASIONALES",
    producto: r.description || "",
    cliente: "",
    proveedor: "",
    costo: 0,
    precioVenta: Number(r.amount) || 0,
    debe: "NO",
    ganancia: Number(r.amount) || 0,
    margen: "100%",
  }));
}

function abonosToIngresos(payments) {
  return payments.map((p) => ({
    id: "pay_" + p.id,
    _row: "pay:" + p.id,
    fecha: p.payment_date,
    tipo: "RECIBIDO CLIENTE",
    producto: "ABONO RECIBIDO",
    cliente: p.orders?.customers?.name || "",
    proveedor: "",
    costo: 0,
    precioVenta: Number(p.amount) || 0,
    debe: "NO",
    ganancia: 0,
    margen: "0%",
  }));
}

export async function readAll(organizationId) {
  const [ordersRes, otherIncomeRes, paymentsRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_date, notes, order_items ( sale_price, actual_cost, products ( name ), suppliers ( name ) ), payments ( amount ), customers ( name )"
      )
      .eq("organization_id", organizationId)
      .order("order_date", { ascending: false }),
    supabase
      .from("other_income")
      .select("id, type, amount, description, income_date")
      .eq("organization_id", organizationId)
      .in("type", ["commission", "occasional", "other"])
      .order("income_date", { ascending: false }),
    supabase
      .from("payments")
      .select("id, amount, payment_date, orders ( customers ( name ) )")
      .eq("organization_id", organizationId)
      .eq("method", ABONO_PAYMENT_METHOD)
      .order("payment_date", { ascending: false }),
  ]);
  if (ordersRes.error) throw ordersRes.error;
  if (otherIncomeRes.error) throw otherIncomeRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  return [
    ...ordersToIngresos(ordersRes.data),
    ...otherIncomeToIngresos(otherIncomeRes.data),
    ...abonosToIngresos(paymentsRes.data),
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

async function nextOrderNumber(organizationId) {
  const { data, error } = await supabase
    .from("orders")
    .select("order_number")
    .eq("organization_id", organizationId)
    .order("order_number", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data.length > 0 ? data[0].order_number + 1 : 1;
}

async function createOrder(organizationId, item) {
  // Los 3 catalogos son independientes entre si — en paralelo en vez de en
  // serie corta el tiempo de guardado de un ingreso a un tercio.
  const [customerId, supplierId, productId] = await Promise.all([
    findOrCreateCustomer(organizationId, item.cliente),
    findOrCreateSupplier(organizationId, item.proveedor),
    findOrCreateProduct(organizationId, item.producto),
  ]);
  const isCompraConSaldo = item.tipo === "COMPRA CON SALDO";
  // COMPRA CON SALDO no deja margen (era la caja propia de clientes especiales):
  // el precio de venta es el costo mismo, así el saldo pendiente = lo que se debe.
  const salePrice = isCompraConSaldo ? Number(item.costo) || 0 : Number(item.precioVenta) || 0;
  const orderNumber = await nextOrderNumber(organizationId);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      organization_id: organizationId,
      customer_id: customerId,
      order_number: orderNumber,
      order_date: item.fecha,
      // sale_type solo admite 'normal'/'occasional' (CHECK constraint) — la
      // distincion de COMPRA CON SALDO queda en notes + customers.credit_enabled.
      sale_type: "normal",
      notes: isCompraConSaldo ? "Compra con saldo (cliente especial)" : null,
    })
    .select("id")
    .single();
  if (orderError) throw orderError;

  const { error: itemError } = await supabase.from("order_items").insert({
    organization_id: organizationId,
    order_id: order.id,
    product_id: productId,
    supplier_id: supplierId,
    quantity: 1,
    sale_price: salePrice,
    actual_cost: Number(item.costo) || 0,
  });
  if (itemError) throw itemError;

  if (item.debe !== "SI" && salePrice > 0) {
    const { error: paymentError } = await supabase.from("payments").insert({
      organization_id: organizationId,
      order_id: order.id,
      amount: salePrice,
      payment_date: item.fecha,
      method: AUTO_PAYMENT_METHOD,
    });
    if (paymentError) throw paymentError;
  }

  return order.id;
}

async function createOtherIncome(organizationId, item) {
  const type = item.tipo === "COMISION" ? "commission" : "occasional";
  const { error } = await supabase.from("other_income").insert({
    organization_id: organizationId,
    type,
    amount: Number(item.precioVenta) || 0,
    description: item.producto,
    income_date: item.fecha,
  });
  if (error) throw error;
}

/**
 * RECIBIDO CLIENTE: abono manual del cliente contra sus ordenes abiertas,
 * mas viejas primero (FIFO). `payments.order_id` es obligatorio en el
 * esquema, asi que si el cliente no tiene ninguna orden con saldo pendiente
 * no hay donde registrar el abono — se usa el flujo de "Abono" del detalle
 * de cliente para ese caso (registrarAbono ya no aplica en Supabase, ver
 * nota en clientes.service).
 */
async function createAbono(organizationId, item) {
  const customerId = await findOrCreateCustomer(organizationId, item.cliente);
  const { data: balances, error: balancesError } = await supabase
    .from("v_order_balances")
    .select("order_id, balance, order_date")
    .eq("organization_id", organizationId)
    .eq("customer_id", customerId)
    .gt("balance", 0)
    .order("order_date", { ascending: true });
  if (balancesError) throw balancesError;
  if (!balances || balances.length === 0) {
    throw new Error(`${item.cliente} no tiene ordenes con saldo pendiente para abonar`);
  }

  let restante = Number(item.precioVenta) || 0;
  for (const o of balances) {
    if (restante <= 0) break;
    const aplicado = Math.min(restante, Number(o.balance));
    const { error } = await supabase.from("payments").insert({
      organization_id: organizationId,
      order_id: o.order_id,
      amount: aplicado,
      payment_date: item.fecha,
      method: ABONO_PAYMENT_METHOD,
    });
    if (error) throw error;
    restante -= aplicado;
  }
}

export async function append(organizationId, item) {
  if (item.tipo === "COMISION" || item.tipo === "OCASIONALES") {
    return createOtherIncome(organizationId, item);
  }
  if (item.tipo === "RECIBIDO CLIENTE") {
    return createAbono(organizationId, item);
  }
  return createOrder(organizationId, item);
}

/**
 * Guarda varias filas EN SERIE (nunca Promise.all): dos inserts concurrentes
 * de un cliente/producto nuevo con el mismo nombre pueden pasar ambos por
 * findOrCreate antes de que el primero termine de crearlo, y quedarian dos
 * filas duplicadas del mismo cliente. En serie, cada fila ve ya creado lo
 * que creo la anterior. Devuelve { ok, fallidas } — si algo falla a mitad
 * de un lote, lo ya guardado queda guardado (no se revierte).
 */
export async function appendMany(organizationId, items) {
  const fallidas = [];
  let ok = 0;
  for (const item of items) {
    try {
      await append(organizationId, item);
      ok++;
    } catch (e) {
      fallidas.push({ item, error: e.message });
    }
  }
  return { ok, fallidas };
}

/**
 * Update: crea el reemplazo PRIMERO y borra el original despues. Si algo
 * falla a mitad de camino (ej. se cae la conexion), el peor caso es un
 * duplicado visible y corregible — nunca perder el registro original en
 * silencio, que es lo que pasaria si se borrara primero y la creacion
 * fallara despues. `item._row` trae el prefijo de tabla (ord:/oi:/pay:)
 * del registro original a borrar.
 *
 * Excepcion: RECIBIDO CLIENTE (abono) SI borra primero — createAbono
 * reparte el monto contra el saldo abierto de las ordenes en ese momento,
 * y ese saldo tiene que reflejar que el abono viejo ya no cuenta, o el
 * reparto (FIFO) sale mal.
 */
export async function update(organizationId, item) {
  if (item.tipo === "RECIBIDO CLIENTE") {
    await remove(item._row);
    await append(organizationId, item);
    return;
  }
  await append(organizationId, item);
  await remove(item._row);
}

export async function remove(rowRef) {
  const [table, id] = String(rowRef).split(":");
  if (table === "ord") {
    await supabase.from("payments").delete().eq("order_id", id);
    await supabase.from("order_items").delete().eq("order_id", id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) throw error;
  } else if (table === "oi") {
    const { error } = await supabase.from("other_income").delete().eq("id", id);
    if (error) throw error;
  } else if (table === "pay") {
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) throw error;
  }
}
