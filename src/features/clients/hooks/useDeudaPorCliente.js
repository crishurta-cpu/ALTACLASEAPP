import { useMemo } from "react";

/**
 * Agrupa la deuda real por cliente usando la hoja CLIENTES.
 *
 * Regla crítica:
 * - deudaTotal (col G) = saldo bruto - abonos.
 * - Si deudaTotal no existe, se usa saldo bruto como fallback histórico.
 * - No usa _row ni escribe en CLIENTES; App sigue usando updateCell.
 */
function useDeudaPorCliente(clientesResumen) {
  return useMemo(() => {
    const deudaPorCliente = {};

    (clientesResumen || []).forEach((c) => {
      const k = c.cliente.toUpperCase().trim();
      const prev = deudaPorCliente[k];
      const deudaReal = c.deudaTotal !== undefined ? c.deudaTotal : c.saldo;

      deudaPorCliente[k] = {
        debe: (prev?.debe || false) || c.debe === "SI",
        saldo: (prev?.saldo || 0) + deudaReal,
        abonos: (prev?.abonos || 0) + (c.abonos || 0),
      };
    });

    return deudaPorCliente;
  }, [clientesResumen]);
}

export default useDeudaPorCliente;
