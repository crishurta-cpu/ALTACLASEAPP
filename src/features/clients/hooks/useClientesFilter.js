import { useMemo } from "react";
import { cuentaParaListaClientes } from "../../../constants";
import useDeudaPorCliente from "./useDeudaPorCliente";

export const PORPAGINA = 10;

/**
 * Construye el mapa de clientes, aplica búsqueda/filtro por inicial y pagina.
 *
 * Usa cuentaParaListaClientes, no cuentaParaTotales. Es una regla crítica
 * porque la pantalla Clientes tiene exclusiones distintas a Home.
 */
function useClientesFilter(db, q, letraFiltro, pagina) {
  const deudaPorCliente = useDeudaPorCliente(db.clientesResumen);

  const map = useMemo(() => {
    const nextMap = {};

    db.ingresos.filter(cuentaParaListaClientes).forEach((i) => {
      const k = (i.cliente || "").toUpperCase().trim();
      if (!k) return;
      if (!nextMap[k]) nextMap[k] = { ventas: [], gan: 0, debe: false };
      nextMap[k].ventas.push(i);
      nextMap[k].gan += i.ganancia;
    });

    Object.keys(nextMap).forEach((k) => {
      nextMap[k].debe = deudaPorCliente[k]?.debe || false;
      nextMap[k].saldo = deudaPorCliente[k]?.saldo || 0;
      nextMap[k].abonos = deudaPorCliente[k]?.abonos || 0;
    });

    return nextMap;
  }, [db.ingresos, deudaPorCliente]);

  const letrasDisponibles = useMemo(
    () => [...new Set(Object.keys(map).map((k) => k[0]).filter(Boolean))].sort(),
    [map],
  );

  const lista = useMemo(
    () =>
      Object.entries(map)
        .filter(([k]) => {
          if (q && !k.includes(q.toUpperCase())) return false;
          if (letraFiltro && k[0] !== letraFiltro) return false;
          return true;
        })
        .sort((a, b) => b[1].gan - a[1].gan),
    [map, q, letraFiltro],
  );

  const totalPaginas = Math.max(1, Math.ceil(lista.length / PORPAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const listaPagina = lista.slice((paginaSegura - 1) * PORPAGINA, paginaSegura * PORPAGINA);

  return {
    map,
    letrasDisponibles,
    lista,
    listaPagina,
    totalPaginas,
    paginaSegura,
  };
}

export default useClientesFilter;
