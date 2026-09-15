import { useContext } from "react";
import { DataContext } from "../contexts/DataContext";

/**
 * Retorna { db, loading, initDone, initError, lastSync, clientes, proveedores,
 * loadData, saveIngreso, saveGasto, updateIngreso, updateGasto, removeIngreso,
 * removeGasto, addInventario, editInventario, removeInventario, addDeuda,
 * editDeuda, removeDeuda, marcarPagado, registrarAbono }.
 */
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
