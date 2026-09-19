// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import useClientesFilter from "./useClientesFilter";

const db = {
  ingresos: [
    { cliente: "juan", tipo: "VENTA", ganancia: 30000 },
    { cliente: "JUAN", tipo: "VENTA", ganancia: 10000 }, // misma persona, distinto case
    { cliente: "ana", tipo: "VENTA", ganancia: 50000 },
    { cliente: "PARQUEADERO", tipo: "VENTA", ganancia: 999999 }, // movimiento interno, excluido
  ],
  clientesResumen: [
    { cliente: "JUAN", debe: "SI", deudaTotal: 20000, abonos: 5000 },
    { cliente: "ANA", debe: "NO", saldo: 0 },
  ],
};

describe("useClientesFilter", () => {
  it("agrupa por cliente normalizando mayúsculas y excluye movimientos internos", () => {
    const { result } = renderHook(() => useClientesFilter(db, "", 1));
    expect(Object.keys(result.current.map).sort()).toEqual(["ANA", "JUAN"]);
    expect(result.current.map.JUAN.gan).toBe(40000); // 30000 + 10000
    expect(result.current.map.JUAN.ventas).toHaveLength(2);
  });

  it("trae la deuda real (deudaTotal) desde useDeudaPorCliente", () => {
    const { result } = renderHook(() => useClientesFilter(db, "", 1));
    expect(result.current.map.JUAN.debe).toBe(true);
    expect(result.current.map.JUAN.saldo).toBe(20000);
    expect(result.current.map.JUAN.abonos).toBe(5000);
  });

  it("ordena la lista por ganancia descendente", () => {
    const { result } = renderHook(() => useClientesFilter(db, "", 1));
    expect(result.current.lista.map(([k]) => k)).toEqual(["ANA", "JUAN"]);
  });

  it("filtra por texto de búsqueda (q), como substring del nombre normalizado", () => {
    const { result } = renderHook(() => useClientesFilter(db, "ana", 1));
    expect(result.current.lista).toHaveLength(1);
    expect(result.current.lista[0][0]).toBe("ANA");
  });

  it("pagina la lista con PORPAGINA=10 y corrige página fuera de rango", () => {
    const dbGrande = {
      ingresos: Array.from({ length: 25 }, (_, i) => ({ cliente: `CLIENTE${i}`, tipo: "VENTA", ganancia: i })),
      clientesResumen: [],
    };
    const { result } = renderHook(() => useClientesFilter(dbGrande, "", 99));
    expect(result.current.totalPaginas).toBe(3);
    expect(result.current.paginaSegura).toBe(3);
    expect(result.current.listaPagina).toHaveLength(5); // última página: 25 - 20
  });
});
