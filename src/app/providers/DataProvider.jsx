import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API, SYNC_INTERVAL_MS, K, cuentaParaListaClientes } from "../../constants";
import { DataContext } from "../contexts/DataContext";
import { fetchSheet, appendRow, updateRow, deleteRow } from "../../services/api";
import {
  parseIngresos,
  parseGastos,
  parseInventario,
  parseClientesResumen,
  parseClientesEspeciales,
  parseDeudaPersonal,
  ingresoToRow,
  gastoToRow,
  inventarioToRow,
  deudaPersonalToRow,
} from "../../services/parsers";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

/**
 * Datos de negocio: fetch/sync contra Google Sheets + todas las mutaciones
 * (ingresos, gastos, inventario, deuda personal, marcar pagado, abonos).
 * Comportamiento idéntico al que vivía inline en App.jsx antes de Fase 16,
 * incluida la estrategia `allSettled` (INGRESOS/GASTOS críticos, el resto
 * degrada a lista vacía si falla) y el auto-sync cada 2 min + al volver a la pestaña.
 */
export function DataProvider({ children }) {
  const { autenticado } = useAuth();
  const { flash } = useToast();

  const [db, setDb] = useState({
    ingresos: [],
    gastos: [],
    inventario: [],
    clientesResumen: [],
    clientesEspeciales: [],
    deudaPersonal: [],
  });
  const [loading, setLoading] = useState(false);
  const [initDone, setInitDone] = useState(false);
  const [initError, setInitError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const intervalRef = useRef(null);

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        // allSettled: si una hoja nueva falla (nombre de columna distinto, etc.) las demás
        // siguen cargando — INGRESOS y GASTOS son las únicas que de verdad no pueden fallar.
        const sheets = ["INGRESOS", "GASTOS", "INVENTARIO", "CLIENTES", "CLIENTES ESPECIALES", "DEUDA VALEN"];
        const results = await Promise.allSettled(sheets.map(fetchSheet));
        const [rIng, rGas, rInv, rCli, rCliEsp, rDeuda] = results;

        if (rIng.status === "rejected") throw rIng.reason; // INGRESOS es crítico, si falla, falla todo
        if (rGas.status === "rejected") throw rGas.reason; // GASTOS también

        const ingresos = parseIngresos(rIng.value);
        const gastos = parseGastos(rGas.value);
        const inventario = rInv.status === "fulfilled" ? parseInventario(rInv.value) : [];
        const clientesResumen = rCli.status === "fulfilled" ? parseClientesResumen(rCli.value) : [];
        const clientesEspeciales = rCliEsp.status === "fulfilled" ? parseClientesEspeciales(rCliEsp.value) : [];
        const deudaPersonal = rDeuda.status === "fulfilled" ? parseDeudaPersonal(rDeuda.value) : [];

        setDb({ ingresos, gastos, inventario, clientesResumen, clientesEspeciales, deudaPersonal });
        setLastSync(new Date());
        setInitError(null);
        if (!silent) flash(`✓ ${ingresos.length} ingresos · ${gastos.length} gastos`);
      } catch (e) {
        if (!silent) {
          flash("⚠️ Error conectando con Sheets", K.red);
          setInitError(e.message);
        }
        // si falla un sync silencioso (de fondo), no molestamos con toast, solo lo dejamos pasar y se reintenta en el próximo ciclo
      } finally {
        if (!silent) setLoading(false);
        setInitDone(true);
      }
    },
    [flash]
  );

  // Carga inicial
  useEffect(() => {
    if (autenticado) loadData(false);
  }, [loadData, autenticado]);

  // Auto-sync cada 2 minutos en segundo plano, y al volver a la pestaña/app
  useEffect(() => {
    if (!autenticado) return;
    intervalRef.current = setInterval(() => {
      loadData(true);
    }, SYNC_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadData(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadData, autenticado]);

  const saveIngreso = useCallback(
    async (row) => {
      await appendRow("INGRESOS", row);
      await loadData(true);
    },
    [loadData]
  );
  const saveGasto = useCallback(
    async (row) => {
      await appendRow("GASTOS", row);
      await loadData(true);
    },
    [loadData]
  );
  const updateIngreso = useCallback(
    async (item) => {
      await updateRow("INGRESOS", item._row, ingresoToRow(item));
      await loadData(true);
      flash("✓ Ingreso actualizado");
    },
    [loadData, flash]
  );
  const updateGasto = useCallback(
    async (item) => {
      await updateRow("GASTOS", item._row, gastoToRow(item));
      await loadData(true);
      flash("✓ Gasto actualizado");
    },
    [loadData, flash]
  );
  const removeIngreso = useCallback(
    async (item) => {
      await deleteRow("INGRESOS", item._row);
      await loadData(true);
      flash("✓ Ingreso borrado", K.red);
    },
    [loadData, flash]
  );
  const removeGasto = useCallback(
    async (item) => {
      await deleteRow("GASTOS", item._row);
      await loadData(true);
      flash("✓ Gasto borrado", K.red);
    },
    [loadData, flash]
  );

  // ── Inventario ──
  const addInventario = useCallback(
    async (it) => {
      await appendRow("INVENTARIO", inventarioToRow(it));
      await loadData(true);
      flash("✓ Agregado al inventario", K.purple);
    },
    [loadData, flash]
  );
  const editInventario = useCallback(
    async (it) => {
      await updateRow("INVENTARIO", it._row, inventarioToRow(it));
      await loadData(true);
      flash("✓ Inventario actualizado", K.purple);
    },
    [loadData, flash]
  );
  const removeInventario = useCallback(
    async (it) => {
      await deleteRow("INVENTARIO", it._row);
      await loadData(true);
      flash("✓ Borrado del inventario", K.red);
    },
    [loadData, flash]
  );

  // ── Personal (Deuda Valen) ──
  const addDeuda = useCallback(
    async (it) => {
      await appendRow("DEUDA VALEN", deudaPersonalToRow(it));
      await loadData(true);
      flash("✓ Movimiento agregado");
    },
    [loadData, flash]
  );
  const editDeuda = useCallback(
    async (it) => {
      await updateRow("DEUDA VALEN", it._row, deudaPersonalToRow(it));
      await loadData(true);
      flash("✓ Movimiento actualizado");
    },
    [loadData, flash]
  );
  const removeDeuda = useCallback(
    async (it) => {
      await deleteRow("DEUDA VALEN", it._row);
      await loadData(true);
      flash("✓ Movimiento borrado", K.red);
    },
    [loadData, flash]
  );

  // ── Marcar pagado: actualiza DEBE?=NO en CADA fila pendiente de ese cliente.
  // Secuencial (no Promise.all) para evitar escrituras concurrentes a la misma hoja.
  const marcarPagado = useCallback(
    async (pendientes, estado = "NO") => {
      for (const v of pendientes) {
        const actualizado = { ...v, debe: estado };
        await updateRow("INGRESOS", v._row, ingresoToRow(actualizado));
      }
      const msg = estado === "NO" ? "pagado" : "marcado como debe";
      await loadData(true);
      flash(`✓ ${pendientes.length} ${msg}`);
    },
    [loadData, flash]
  );

  // Registra un abono en la columna F de la hoja CLIENTES, buscando por nombre.
  // No usa _row porque las filas de CLIENTES se reordenan solas con fórmulas UNIQUE/FILTER.
  const registrarAbono = useCallback(
    async (cliente, montoNuevo) => {
      const qs = new URLSearchParams({
        action: "updateCell",
        sheet: "CLIENTES",
        lookupValue: cliente,
        col: "F",
        value: String(montoNuevo),
      }).toString();
      const res = await fetch(`${API}?${qs}`, { method: "GET", redirect: "follow" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Error al registrar abono");
      await loadData(true);
      flash(`✓ Abono de ${cliente} registrado`);
    },
    [loadData, flash]
  );

  const clientes = useMemo(
    () => [
      ...new Set(
        db.ingresos
          .filter(cuentaParaListaClientes)
          .map((i) => i.cliente?.toUpperCase().trim())
          .filter(Boolean)
      ),
    ].sort(),
    [db.ingresos]
  );

  const proveedores = useMemo(
    () => [...new Set(db.ingresos.map((i) => i.proveedor?.toUpperCase().trim()).filter(Boolean))].sort(),
    [db.ingresos]
  );

  const value = useMemo(
    () => ({
      db,
      loading,
      initDone,
      initError,
      lastSync,
      clientes,
      proveedores,
      loadData,
      saveIngreso,
      saveGasto,
      updateIngreso,
      updateGasto,
      removeIngreso,
      removeGasto,
      addInventario,
      editInventario,
      removeInventario,
      addDeuda,
      editDeuda,
      removeDeuda,
      marcarPagado,
      registrarAbono,
    }),
    [
      db,
      loading,
      initDone,
      initError,
      lastSync,
      clientes,
      proveedores,
      loadData,
      saveIngreso,
      saveGasto,
      updateIngreso,
      updateGasto,
      removeIngreso,
      removeGasto,
      addInventario,
      editInventario,
      removeInventario,
      addDeuda,
      editDeuda,
      removeDeuda,
      marcarPagado,
      registrarAbono,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
