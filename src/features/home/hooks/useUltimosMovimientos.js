import { useMemo } from "react";
import { cuentaParaTotales } from "../../../constants";

/**
 * Agrupa ingresos por día (top 5 más recientes) para el gráfico "Ganancia por día".
 *
 * Usa TODOS los ingresos (no solo el mes en curso) para que funcione bien
 * incluso los primeros días del mes, cuando el mes actual aún no tiene 5 días con datos.
 */
function useUltimosMovimientos(db) {
  return useMemo(() => {
    const dias = {};
    db.ingresos.filter(cuentaParaTotales).forEach((item) => {
      const dk = new Date(item.fecha).toDateString();
      if (!dias[dk]) dias[dk] = { fecha: item.fecha, total: 0, n: 0 };
      dias[dk].total += item.ganancia;
      dias[dk].n += 1;
    });
    const diasIng = Object.values(dias).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);
    return { diasIng };
  }, [db.ingresos]);
}

export default useUltimosMovimientos;
