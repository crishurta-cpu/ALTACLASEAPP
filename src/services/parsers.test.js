import { describe, it, expect } from "vitest";
import {
  esClienteEspecial,
  noEsClienteReal,
  cuentaParaTotales,
  cuentaParaListaClientes,
} from "../constants";
import {
  parseIngresos,
  parseGastos,
  parseInventario,
  parseClientesResumen,
  parseClientesEspeciales,
  parseDeudaPersonal,
  ingresoToRow,
  gastoToRow,
  inventarioToRow,
  deudaPersonalToRow,
} from "./parsers";

describe("Business Rule Filters", () => {
  it("should identify special clients (BAYRON, MARCO, MARCOS)", () => {
    expect(esClienteEspecial("BAYRON")).toBe(true);
    expect(esClienteEspecial("bayron ")).toBe(true);
    expect(esClienteEspecial("MARCO")).toBe(true);
    expect(esClienteEspecial("MARCOS")).toBe(true);
    expect(esClienteEspecial("CRIS")).toBe(false);
  });

  it("should identify non-client internal movements", () => {
    expect(noEsClienteReal("PARQUEADERO")).toBe(true);
    expect(noEsClienteReal("PIPE")).toBe(true);
    expect(noEsClienteReal("PRESTAMO")).toBe(true);
    expect(noEsClienteReal("CRIS")).toBe(true);
    expect(noEsClienteReal("JUAN")).toBe(false);
  });

  it("should filter totals for special clients correctly", () => {
    // Normal client should always count for totals
    expect(cuentaParaTotales({ cliente: "JUAN", tipo: "VENTA" })).toBe(true);
    expect(cuentaParaTotales({ cliente: "JUAN", tipo: "RECIBIDO CLIENTE" })).toBe(true);

    // Special client should only count for VENTA or COMISION
    expect(cuentaParaTotales({ cliente: "BAYRON", tipo: "VENTA" })).toBe(true);
    expect(cuentaParaTotales({ cliente: "BAYRON", tipo: "COMISION" })).toBe(true);
    expect(cuentaParaTotales({ cliente: "BAYRON", tipo: "RECIBIDO CLIENTE" })).toBe(false);
    expect(cuentaParaTotales({ cliente: "MARCO", tipo: "COMPRA CON SALDO" })).toBe(false);
  });

  it("should filter lists of clients correctly", () => {
    // Normal client should be on the list
    expect(cuentaParaListaClientes({ cliente: "JUAN", tipo: "VENTA" })).toBe(true);

    // Non-clients (internal movements) should not be on the client list (unless they are special)
    expect(cuentaParaListaClientes({ cliente: "PARQUEADERO", tipo: "VENTA" })).toBe(false);
    expect(cuentaParaListaClientes({ cliente: "CRIS", tipo: "VENTA" })).toBe(false);

    // Special clients (Bayron, Marco) are also non-clients technically, but they are allowed if tipo is VENTA or COMISION
    expect(cuentaParaListaClientes({ cliente: "BAYRON", tipo: "VENTA" })).toBe(true);
    expect(cuentaParaListaClientes({ cliente: "BAYRON", tipo: "COMISION" })).toBe(true);
    expect(cuentaParaListaClientes({ cliente: "BAYRON", tipo: "RECIBIDO CLIENTE" })).toBe(false);
  });
});

describe("Data Parsers", () => {
  it("should parse ingresos rows correctly", () => {
    const rawRows = [
      {
        _row: 5,
        "Marca temporal": "2026-07-06T12:00:00.000Z",
        "TIPO": "VENTA",
        "PRODUCTO": "Nike Air Force",
        "CLIENTE": "Juan Perez",
        "PROVEEDOR": "Importador XYZ",
        "COSTO": "120000",
        "PRECIO VENTA": "150000",
        "DEBE?": "SI",
        "GANANCIA": "30000"
      },
      {
        _row: 6,
        "Marca temporal": "", // invalid row
        "TIPO": "VENTA",
        "PRODUCTO": "Adidas Samba"
      }
    ];

    const parsed = parseIngresos(rawRows);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({
      id: "i5",
      _row: 5,
      fecha: "2026-07-06T12:00:00.000Z",
      tipo: "VENTA",
      producto: "Nike Air Force",
      cliente: "Juan Perez",
      proveedor: "Importador XYZ",
      costo: 120000,
      precioVenta: 150000,
      debe: "SI",
      ganancia: 30000,
      margen: "20%"
    });
  });

  it("should parse gastos rows correctly", () => {
    const rawRows = [
      {
        _row: 12,
        "Marca temporal": "2026-07-06T12:30:00.000Z",
        "CONCEPTO": "GASTO FIJO",
        "COSTO": "50000",
        "REFERENCIA DE GASTO": "Parqueadero"
      }
    ];

    const parsed = parseGastos(rawRows);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].concepto).toBe("GASTO FIJO");
    expect(parsed[0].costo).toBe(50000);
    expect(parsed[0].referencia).toBe("Parqueadero");
  });

  it("should discard gastos rows without concepto or costo", () => {
    const rawRows = [
      { _row: 1, "Marca temporal": "2026-07-06T12:00:00.000Z", "CONCEPTO": "", "COSTO": "1000" },
      { _row: 2, "Marca temporal": "2026-07-06T12:00:00.000Z", "CONCEPTO": "MERCADO", "COSTO": "0" },
    ];
    expect(parseGastos(rawRows)).toHaveLength(0);
  });

  it("should parse inventario rows correctly and discard rows without producto", () => {
    const rawRows = [
      { _row: 3, "FECHA": "2026-07-01", "PRODUCTO": "Nike Air Force", "PROVEEDOR": "Lider", "COSTO": "80000" },
      { _row: 4, "FECHA": "2026-07-02", "PRODUCTO": "", "PROVEEDOR": "Lider", "COSTO": "1000" },
      { _row: 5, "FECHA": "fecha-invalida", "PRODUCTO": "Adidas Samba", "COSTO": "1000" },
    ];
    const parsed = parseInventario(rawRows);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ id: "inv3", _row: 3, producto: "Nike Air Force", proveedor: "Lider", costo: 80000 });
  });

  it("should parse clientesResumen with deudaTotal and abonos", () => {
    const rawRows = [
      { "CLIENTE": "Juan", "TOTAL VENTA": "500000", "SALDO": "100000", "DEBE?": "si", "ABONOS": "20000", "DEUDA TOTAL": "80000" },
      { "CLIENTE": "" }, // sin cliente, descartada
    ];
    const parsed = parseClientesResumen(rawRows);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ cliente: "Juan", totalVenta: 500000, saldo: 100000, debe: "SI", abonos: 20000, deudaTotal: 80000 });
  });

  it("should parse clientesEspeciales using CLIENTE LIMPIO with fallback a CLIENTE", () => {
    const rawRows = [
      { "CLIENTE LIMPIO": "BAYRON", "SALDO INICIAL": "0", "RECARGAS": "50000", "COMPRAS": "30000", "SALDO": "20000" },
      { "CLIENTE": "MARCO", "SALDO": "5000" },
    ];
    const parsed = parseClientesEspeciales(rawRows);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].cliente).toBe("BAYRON");
    expect(parsed[1].cliente).toBe("MARCO");
  });

  it("should parse deudaPersonal rows and discard rows without movimiento", () => {
    const rawRows = [
      { _row: 7, "FECHA": "2026-07-01", "MOVIMIENTO": "Prestamo", "PRESTO": "100000", "PAGO": "0", "SALDO": "100000" },
      { _row: 8, "FECHA": "2026-07-02", "MOVIMIENTO": "" },
    ];
    const parsed = parseDeudaPersonal(rawRows);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ id: "dp7", _row: 7, movimiento: "Prestamo", presto: 100000, pago: 0, saldo: 100000 });
  });
});

describe("Row Converters (orden de columnas debe coincidir con Sheets)", () => {
  it("ingresoToRow preserves column order", () => {
    const row = ingresoToRow({
      fecha: "2026-07-06T12:00:00.000Z", tipo: "VENTA", producto: "Nike", cliente: "Juan",
      proveedor: "Lider", costo: 100, precioVenta: 150, debe: "NO", ganancia: 50, margen: "33%",
    });
    expect(row).toHaveLength(10);
    expect(row[1]).toBe("VENTA");
    expect(row[2]).toBe("Nike");
    expect(row[7]).toBe("NO");
    expect(row[9]).toBe("33%");
  });

  it("gastoToRow preserves column order", () => {
    const row = gastoToRow({ fecha: "2026-07-06T12:00:00.000Z", concepto: "MERCADO", costo: 1000, referencia: "Arriendo" });
    expect(row).toEqual([expect.any(String), "MERCADO", 1000, "Arriendo"]);
  });

  it("inventarioToRow preserves column order (FECHA, PRODUCTO, PROVEEDOR, COSTO)", () => {
    const row = inventarioToRow({ fecha: "2026-07-06T12:00:00.000Z", producto: "Nike", proveedor: "Lider", costo: 80000 });
    expect(row).toEqual([expect.any(String), "Nike", "Lider", 80000]);
  });

  it("deudaPersonalToRow preserves column order (FECHA, MOVIMIENTO, PRESTO, PAGO, SALDO)", () => {
    const row = deudaPersonalToRow({ fecha: "2026-07-01", movimiento: "Prestamo", presto: 100000, pago: "", saldo: 100000 });
    expect(row).toEqual(["2026-07-01", "Prestamo", 100000, "", 100000]);
  });
});
