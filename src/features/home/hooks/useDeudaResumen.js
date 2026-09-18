import { useMemo } from "react";
import { esClienteEspecial } from "../../../constants";

/**
 * Agrupa `db.clientesResumen` por nombre (uppercase+trim) excluyendo clientes especiales.
 * Combina duplicados por espacios extra en el nombre.
 * Devuelve `debenList` (clientes con debe=SI) y `totalPorCobrar`.
 *
 * Diferencia con `useDeudaPorCliente` de features/clients/: este SÍ excluye
 * `esClienteEspecial` (BAYRON, MARCO, etc.) porque Home no los muestra.
 */
function useDeudaResumen(db) {
  return useMemo(() => {
    const debenMap = {};
    (db.clientesResumen || []).forEach((c) => {
      if (esClienteEspecial(c.cliente)) return;
      const k = c.cliente.toUpperCase().trim();
      if (!debenMap[k]) debenMap[k] = { cliente: k, saldo: 0, abonos: 0, debe: false };
      const neto = c.deudaTotal != null && c.deudaTotal > 0 ? c.deudaTotal : (c.saldo - (c.abonos || 0));
      debenMap[k].saldo += Math.max(0, neto);
      debenMap[k].abonos += (c.abonos || 0);
      debenMap[k].debe = debenMap[k].debe || c.debe === "SI";
    });
    const debenList = Object.values(debenMap).filter((c) => c.debe);
    const totalPorCobrar = debenList.reduce((total, cliente) => total + (cliente.saldo || 0), 0);
    const deudaPorNombre = {};
    Object.values(debenMap).forEach((c) => {
      deudaPorNombre[c.cliente] = c.saldo;
    });
    return { debenList, totalPorCobrar, deudaPorNombre };
  }, [db.clientesResumen]);
}

export default useDeudaResumen;
