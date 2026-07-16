// Parsers and format converter functions for the sheets data

export function parseIngresos(rows) {
  return rows.map(r => {
    const ts = r["Marca temporal"];
    if (!ts) return null;
    const fecha = new Date(ts);
    if (isNaN(fecha)) return null;
    const tipo = String(r["TIPO"] || "").trim();
    if (!tipo) return null;
    const costo = Number(r["COSTO"]) || 0;
    const pv = Number(r["PRECIO VENTA"]) || 0;
    const gan = Number(r["GANANCIA"]) || pv - costo;
    return {
      id: "i" + r._row, _row: r._row, fecha: fecha.toISOString(), tipo,
      producto: String(r["PRODUCTO"] || "").trim(),
      cliente: String(r["CLIENTE"] || "").trim(),
      proveedor: String(r["PROVEEDOR"] || "").trim(),
      costo, precioVenta: pv,
      debe: String(r["DEBE?"] || "NO").toUpperCase().trim(),
      ganancia: gan,
      margen: pv > 0 ? Math.round(gan / pv * 100) + "%" : "0%",
    };
  }).filter(r => r && r.tipo && r.producto);
}

export function parseGastos(rows) {
  return rows.map(r => {
    const ts = r["Marca temporal"];
    if (!ts) return null;
    const fecha = new Date(ts);
    if (isNaN(fecha)) return null;
    const concepto = String(r["CONCEPTO"] || "").toUpperCase().trim();
    const costo = Number(r["COSTO"]) || 0;
    const ref = String(r["REFERENCIA DE GASTO"] || "").trim();
    if (!concepto || !costo) return null;
    return { id: "g" + r._row, _row: r._row, fecha: fecha.toISOString(), concepto, costo, referencia: ref };
  }).filter(r => r && r.concepto);
}

// Reconstruye el array de columnas en el MISMO orden que espera la hoja, a partir de un registro parseado.
export function ingresoToRow(it) {
  const d = new Date(it.fecha);
  const ts = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}:00`;
  return [ts, it.tipo, it.producto, it.cliente, it.proveedor, it.costo, it.precioVenta, it.debe, it.ganancia, it.margen];
}

export function gastoToRow(it) {
  const d = new Date(it.fecha);
  const ts = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}:00`;
  return [ts, it.concepto, it.costo, it.referencia];
}

// INVENTARIO: FECHA, PRODUCTO, PROVEEDOR, COSTO
export function inventarioToRow(it) {
  const d = new Date(it.fecha);
  const fechaStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  return [fechaStr, it.producto, it.proveedor, it.costo];
}

// DEUDA VALEN: FECHA, MOVIMIENTO, PRESTO, PAGO, SALDO
export function deudaPersonalToRow(it) {
  return [it.fecha, it.movimiento, it.presto || "", it.pago || "", it.saldo];
}

// INVENTARIO: FECHA, PRODUCTO, PROVEEDOR, COSTO — lista simple de compras, sin cantidades.
export function parseInventario(rows) {
  return rows.map(r => {
    const fecha = new Date(r["FECHA"]);
    if (isNaN(fecha)) return null;
    const producto = String(r["PRODUCTO"] || "").trim();
    if (!producto) return null;
    return {
      id: "inv" + r._row, _row: r._row, fecha: fecha.toISOString(),
      producto, proveedor: String(r["PROVEEDOR"] || "").trim(),
      costo: Number(r["COSTO"]) || 0,
    };
  }).filter(Boolean);
}

// CLIENTES: resumen ya armado en Sheets por cliente. Lo usamos como referencia,
// pero los totales del Home se recalculan en JS sumando INGRESOS reales para que
// editar/borrar un registro se refleje al instante sin depender de fórmulas.
export const parseClientesResumen = (rows) => {
  return rows.map(r => {
    const cliente = String(r["CLIENTE"] || "").trim();
    if (!cliente) return null;
    return {
      cliente,
      totalVenta: Number(r["TOTAL VENTA"]) || 0,
      totalIngresos: Number(r["TOTAL INGRESOS"]) || 0,
      saldo: Number(r["SALDO"]) || 0,
      debe: String(r["DEBE?"] || "NO").toUpperCase().trim(),
      abonos: Number(r["ABONOS"]) || 0,
      deudaTotal: Number(r["DEUDA TOTAL"]) || 0,
      gananciaSheet: Number(r["GANANCIA X CLIENTE"]) || 0,
    };
  }).filter(Boolean);
};

// CLIENTES ESPECIALES: Bayron y Marco con su sistema de saldo tipo cuenta corriente.
export const parseClientesEspeciales = (rows) => {
  return rows.map(r => {
    const cliente = String(r["CLIENTE LIMPIO"] || r["CLIENTE"] || "").trim();
    if (!cliente) return null;
    return {
      cliente,
      saldoInicial: Number(r["SALDO INICIAL"]) || 0,
      recargas: Number(r["RECARGAS"]) || 0,
      compras: Number(r["COMPRAS"]) || 0,
      comisiones: Number(r["COMISIONES"]) || 0,
      saldo: Number(r["SALDO"]) || 0,
      debe: String(r["DEBE?"] || "NO").toUpperCase().trim(),
    };
  }).filter(Boolean);
};

// DEUDA VALEN: libro personal, FECHA, MOVIMIENTO, PRESTO, PAGO, SALDO. Vive separado del negocio.
export const parseDeudaPersonal = (rows) => {
  return rows.map(r => {
    const mov = String(r["MOVIMIENTO"] || "").trim();
    if (!mov) return null;
    return {
      id: "dp" + r._row, _row: r._row,
      fecha: r["FECHA"] ? String(r["FECHA"]) : "",
      movimiento: mov,
      presto: Number(r["PRESTO"]) || 0,
      pago: Number(r["PAGO"]) || 0,
      saldo: Number(r["SALDO"]) || 0,
    };
  }).filter(Boolean);
};
