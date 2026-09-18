import { useMemo } from "react";
import { cuentaParaTotales } from "../../../constants";

/**
 * Resumen de la semana en curso vs la anterior (lunes a lunes).
 * Devuelve ganSem, ganSemAnt, tendSem (% de cambio), ventasSem, gasSem.
 * `tendSem` es null si no hay datos de la semana anterior.
 */
function useResumenSemanal(db) {
  return useMemo(() => {
    const hoy = new Date();
    const dow = (hoy.getDay() + 6) % 7; // lunes=0 ... domingo=6
    const inicioSem = new Date(hoy);
    inicioSem.setDate(hoy.getDate() - dow);
    inicioSem.setHours(0, 0, 0, 0);
    const inicioSemAnt = new Date(inicioSem);
    inicioSemAnt.setDate(inicioSem.getDate() - 7);

    const semActual = db.ingresos.filter((i) => cuentaParaTotales(i) && new Date(i.fecha) >= inicioSem);
    const semAnt = db.ingresos.filter((i) => cuentaParaTotales(i) && new Date(i.fecha) >= inicioSemAnt && new Date(i.fecha) < inicioSem);
    const ganSem = semActual.reduce((s, i) => s + i.ganancia, 0);
    const ganSemAnt = semAnt.reduce((s, i) => s + i.ganancia, 0);
    const tendSem = ganSemAnt > 0 ? Math.round((ganSem - ganSemAnt) / ganSemAnt * 100) : null;
    const ventasSem = semActual.length;
    const gasSem = db.gastos.filter((g) => new Date(g.fecha) >= inicioSem).reduce((s, g) => s + g.costo, 0);

    return { ganSem, ganSemAnt, tendSem, ventasSem, gasSem };
  }, [db.ingresos, db.gastos]);
}

export default useResumenSemanal;
