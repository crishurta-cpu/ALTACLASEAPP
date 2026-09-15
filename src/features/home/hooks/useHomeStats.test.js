// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import useHomeStats from "./useHomeStats";

const hoyISO = () => new Date().toISOString();
const mesPasadoISO = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString();
};

describe("useHomeStats", () => {
  it("suma ventas, ganancia y gastos SOLO del mes en curso", () => {
    const db = {
      ingresos: [
        { fecha: hoyISO(), cliente: "JUAN", tipo: "VENTA", precioVenta: 100000, ganancia: 30000 },
        { fecha: mesPasadoISO(), cliente: "JUAN", tipo: "VENTA", precioVenta: 999999, ganancia: 999999 },
      ],
      gastos: [
        { fecha: hoyISO(), concepto: "MERCADO", costo: 20000 },
        { fecha: mesPasadoISO(), concepto: "MERCADO", costo: 999999 },
      ],
    };
    const { result } = renderHook(() => useHomeStats(db));
    expect(result.current.ventas).toBe(100000);
    expect(result.current.gan).toBe(30000);
    expect(result.current.gastos).toBe(20000);
    expect(result.current.util).toBe(10000); // 30000 - 20000
  });

  it("excluye clientes especiales salvo VENTA/COMISION (regla cuentaParaTotales)", () => {
    const db = {
      ingresos: [
        { fecha: hoyISO(), cliente: "BAYRON", tipo: "VENTA", precioVenta: 50000, ganancia: 10000 },
        { fecha: hoyISO(), cliente: "BAYRON", tipo: "RECIBIDO CLIENTE", precioVenta: 999999, ganancia: 999999 },
      ],
      gastos: [],
    };
    const { result } = renderHook(() => useHomeStats(db));
    expect(result.current.ventas).toBe(50000);
    expect(result.current.gan).toBe(10000);
  });

  it("suma el ahorro solo de gastos con concepto AHORRO", () => {
    const db = {
      ingresos: [],
      gastos: [
        { fecha: hoyISO(), concepto: "AHORRO", costo: 15000 },
        { fecha: hoyISO(), concepto: "MERCADO", costo: 5000 },
      ],
    };
    const { result } = renderHook(() => useHomeStats(db));
    expect(result.current.ahorro).toBe(15000);
    expect(result.current.gastos).toBe(20000);
  });

  it("margen es 0 cuando no hay ventas (evita división por cero)", () => {
    const { result } = renderHook(() => useHomeStats({ ingresos: [], gastos: [] }));
    expect(result.current.mrg).toBe(0);
    expect(result.current.ventas).toBe(0);
  });
});
