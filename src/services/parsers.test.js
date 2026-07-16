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
});
