import { useMemo } from "react";
import { cuentaParaTotales, mKey, curM } from "../../../constants";

/**
 * Calcula totales del mes en curso para la Home.
 * Devuelve ventas, ganancia, gastos, ahorro, utilidad y margen.
 * Aplica la regla de `cuentaParaTotales` (Bayron/Marco solo cuentan si TIPO=VENTA o COMISION).
 */
function useHomeStats(db) {
  return useMemo(() => {
    const m = curM();
    const ing = db.ingresos.filter((i) => mKey(i.fecha) === m && cuentaParaTotales(i));
    const gas = db.gastos.filter((g) => mKey(g.fecha) === m);
    const ventas = ing.reduce((s, i) => s + i.precioVenta, 0);
    const gan = ing.reduce((s, i) => s + i.ganancia, 0);
    const gastos = gas.reduce((s, g) => s + g.costo, 0);
    const ahorro = gas.filter((g) => g.concepto === "AHORRO").reduce((s, g) => s + g.costo, 0);
    const util = gan - gastos;
    const mrg = ventas > 0 ? (util / ventas * 100).toFixed(1) : 0;
    return { ventas, gan, gastos, ahorro, util, mrg };
  }, [db.ingresos, db.gastos]);
}

export default useHomeStats;
