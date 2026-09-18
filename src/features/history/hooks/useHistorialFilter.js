import { useMemo } from "react";
import { cuentaParaTotales, mKey } from "../../../constants";

/**
 * Calcula meses disponibles y filtra ingresos/gastos del mes abierto.
 */
function useHistorialFilter(db, month, filter, buscar, categFiltro, orden) {
  const months = useMemo(
    () => [...new Set([...db.ingresos.map((i) => mKey(i.fecha)), ...db.gastos.map((g) => mKey(g.fecha))].filter(Boolean))].sort().reverse(),
    [db.ingresos, db.gastos],
  );

  return useMemo(() => {
    const ing = db.ingresos.filter((i) => mKey(i.fecha) === month && cuentaParaTotales(i));
    const gas = db.gastos.filter((g) => mKey(g.fecha) === month);
    const ventas = ing.reduce((s, i) => s + i.precioVenta, 0);
    const gan = ing.reduce((s, i) => s + i.ganancia, 0);
    const gastos = gas.reduce((s, g) => s + g.costo, 0);
    const ahorro = gas.filter((g) => g.concepto === "AHORRO").reduce((s, g) => s + g.costo, 0);
    const util = gan - gastos;

    const catMap = {};
    gas.forEach((g) => {
      const cat = g.concepto || "OTRO";
      catMap[cat] = (catMap[cat] || 0) + g.costo;
    });
    const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const categDisponibles = catEntries.map(([k]) => k);

    let gasFiltered = gas;
    if (categFiltro) gasFiltered = gas.filter((g) => g.concepto === categFiltro);
    if (buscar.trim()) {
      const q = buscar.toUpperCase().trim();
      gasFiltered = gasFiltered.filter((g) => (g.referencia || "").toUpperCase().includes(q) || (g.concepto || "").toUpperCase().includes(q));
    }
    gasFiltered = [...gasFiltered].sort((a, b) => (orden === "monto" ? b.costo - a.costo : new Date(b.fecha) - new Date(a.fecha)));

    let ingFiltered = ing;
    if (buscar.trim()) {
      const q = buscar.toUpperCase().trim();
      ingFiltered = ing.filter((x) => (x.producto || "").toUpperCase().includes(q) || (x.cliente || "").toUpperCase().includes(q) || (x.proveedor || "").toUpperCase().includes(q));
    }
    ingFiltered = [...ingFiltered].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return {
      months,
      ing,
      gas,
      ventas,
      gan,
      gastos,
      ahorro,
      util,
      catEntries,
      categDisponibles,
      filtered: filter === "ingresos" ? ingFiltered : gasFiltered,
    };
  }, [db.ingresos, db.gastos, month, filter, buscar, categFiltro, orden, months]);
}

export default useHistorialFilter;
