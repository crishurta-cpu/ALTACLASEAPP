import { useMemo } from "react";
import { cuentaParaTotales } from "../../../constants";

/**
 * Top 5 clientes del mes por ganancia, solo ventas con cliente asignado.
 * Devuelve `top5` (tuplas [nombreUpperTrim, {g, n}]) y `deudaPorNombre` para marcar ⚠️ en top.
 */
function useTopClientes(db, deudaPorNombre) {
  return useMemo(() => {
    const cmap = {};
    db.ingresos
      .filter((i) => cuentaParaTotales(i))
      .filter((i) => i.tipo === "VENTA" && i.cliente)
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
