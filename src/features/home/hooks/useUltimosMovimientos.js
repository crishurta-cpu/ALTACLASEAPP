import { useMemo } from "react";
import { cuentaParaTotales } from "../../../constants";

/**
 * Agrupa ingresos por día (top 5 más recientes) y ordena los últimos gastos.
 * Devuelve `diasIng` para el gráfico de ganancia por día y `ultimosGastos` para el acordeón.
 *
 * Usa TODOS los ingresos/gastos (no solo el mes en curso) para que funcione bien
 * incluso los primeros días del mes, cuando el mes actual aún no tiene 5 días con datos.
 */
function useUltimosMovimientos(db) {
  return useMemo(() => {
    const agruparPorDia = (lista, campoMonto) => {
      const dias = {};
      lista.forEach((item) => {
        const dk = new Date(item.fecha).toDateString();
        if (!dias[dk]) dias[dk] = { fecha: item.fecha, total: 0, n: 0 };
        dias[dk].total += item[campoMonto];
        dias[dk].n += 1;
      });
      return Object.values(dias).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);
    };
    const diasIng = agruparPorDia(db.ingresos.filter(cuentaParaTotales), "ganancia");
    const ultimosGastos = [...db.gastos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);
    return { diasIng, ultimosGastos };
  }, [db.ingresos, db.gastos]);
}

export default useUltimosMovimientos;
