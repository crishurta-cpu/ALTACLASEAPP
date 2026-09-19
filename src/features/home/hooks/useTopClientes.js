import { useMemo } from "react";
import { cuentaParaTotales, mKey, curM } from "../../../constants";

/**
 * Top 5 clientes del MES EN CURSO por ganancia, solo ventas con cliente
 * asignado. Antes sumaba todo el histórico (bug real: mostraba el total
 * del año, no del mes) — ahora filtra por `mKey(fecha) === curM()`, igual
 * que `useHomeStats`.
 * Devuelve `top5` (tuplas [nombreUpperTrim, {g, n}]) y `deudaPorNombre` para marcar ⚠️ en top.
 */
function useTopClientes(db, deudaPorNombre) {
  return useMemo(() => {
    const m = curM();
    const cmap = {};
    db.ingresos
      .filter((i) => cuentaParaTotales(i))
      .filter((i) => i.tipo === "VENTA" && i.cliente && mKey(i.fecha) === m)
      .forEach((i) => {
        const k = i.cliente.toUpperCase().trim();
        if (!cmap[k]) cmap[k] = { g: 0, n: 0 };
        cmap[k].g += i.ganancia;
        cmap[k].n += 1;
      });
    const top5 = Object.entries(cmap).sort((a, b) => b[1].g - a[1].g).slice(0, 5);
    return { top5, deudaPorNombre };
  }, [db.ingresos, deudaPorNombre]);
}

export default useTopClientes;
