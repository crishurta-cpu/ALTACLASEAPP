// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import useHistorialFilter from "./useHistorialFilter";

const db = {
  ingresos: [
    { fecha: "2026-06-10T10:00:00.000Z", cliente: "JUAN", tipo: "VENTA", producto: "Nike", proveedor: "Lider", precioVenta: 100000, ganancia: 30000 },
    { fecha: "2026-06-15T10:00:00.000Z", cliente: "ANA", tipo: "VENTA", producto: "Adidas", proveedor: "Fym", precioVenta: 50000, ganancia: 10000 },
    { fecha: "2026-05-01T10:00:00.000Z", cliente: "JUAN", tipo: "VENTA", producto: "Puma", proveedor: "Lider", precioVenta: 20000, ganancia: 5000 },
  ],
  gastos: [
    { fecha: "2026-06-05T10:00:00.000Z", concepto: "MERCADO", costo: 15000, referencia: "Arriendo junio" },
    { fecha: "2026-06-20T10:00:00.000Z", concepto: "AHORRO", costo: 30000, referencia: "" },
  ],
};

describe("useHistorialFilter", () => {
  it("calcula meses disponibles ordenados descendente", () => {
    const { result } = renderHook(() => useHistorialFilter(db, "2026-06", "ingresos", "", "", "fecha"));
    expect(result.current.months).toEqual(["2026-06", "2026-05"]);
  });

  it("filtra ingresos y gastos SOLO del mes abierto", () => {
    const { result } = renderHook(() => useHistorialFilter(db, "2026-06", "ingresos", "", "", "fecha"));
    expect(result.current.ing).toHaveLength(2);
    expect(result.current.gas).toHaveLength(2);
    expect(result.current.ventas).toBe(150000);
    expect(result.current.gan).toBe(40000);
    expect(result.current.gastos).toBe(45000);
    expect(result.current.ahorro).toBe(30000);
  });

  it("filtra por texto de búsqueda en ingresos (producto/cliente/proveedor)", () => {
    const { result } = renderHook(() => useHistorialFilter(db, "2026-06", "ingresos", "ana", "", "fecha"));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].cliente).toBe("ANA");
  });

  it("filtra gastos por categoría y agrupa catEntries", () => {
    const { result } = renderHook(() => useHistorialFilter(db, "2026-06", "gastos", "", "AHORRO", "fecha"));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].concepto).toBe("AHORRO");
    expect(result.current.categDisponibles).toEqual(expect.arrayContaining(["MERCADO", "AHORRO"]));
  });

  it("ordena gastos por monto cuando orden='monto'", () => {
    const { result } = renderHook(() => useHistorialFilter(db, "2026-06", "gastos", "", "", "monto"));
    expect(result.current.filtered[0].costo).toBe(30000);
  });
});
