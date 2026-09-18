import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SYNC_INTERVAL_MS, K, cuentaParaListaClientes } from "../../constants";
import { DataContext } from "../contexts/DataContext";
import {
  ingresosService,
  gastosService,
  inventarioService,
  clientesService,
  clientesEspecialesService,
  deudaPersonalService,
} from "../../services/sheets";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

/**
 * Datos de negocio: fetch/sync contra Google Sheets + todas las mutaciones
 * (ingresos, gastos, inventario, deuda personal, marcar pagado, abonos),
 * delegadas a `services/sheets/*.service.js` (unificados en Fase 19).
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
        const results = await Promise.allSettled([
          ingresosService.readAll(),
          gastosService.readAll(),
          inventarioService.readAll(),
          clientesService.readAll(),
          clientesEspecialesService.readAll(),
          deudaPersonalService.readAll(),
        ]);
        const [rIng, rGas, rInv, rCli, rCliEsp, rDeuda] = results;

        if (rIng.status === "rejected") throw rIng.reason; // INGRESOS es crítico, si falla, falla todo
        if (rGas.status === "rejected") throw rGas.reason; // GASTOS también

        const ingresos = rIng.value;
        const gastos = rGas.value;
        const inventario = rInv.status === "fulfilled" ? rInv.value : [];
        const clientesResumen = rCli.status === "fulfilled" ? rCli.value : [];
        const clientesEspeciales = rCliEsp.status === "fulfilled" ? rCliEsp.value : [];
        const deudaPersonal = rDeuda.status === "fulfilled" ? rDeuda.value : [];

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

  // Carga inicial al autenticarse (patrón estándar "fetch on mount/condición").
  // Ver la misma nota en useTareas.js: es una carga de datos real, no estado
  // derivado — se suprime el lint de react-hooks a propósito.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // `item` con shape de negocio en los 4 (antes `saveIngreso`/`saveGasto`
  // recibían a veces una fila ya convertida y a veces un item de negocio,
  // según el formulario — inconsistencia real corregida en Fase 19: ver
  // ingresos.service.js/gastos.service.js, que ahora convierten siempre).
  const saveIngreso = useCallback(
    async (item) => {
      await ingresosService.append(item);
      await loadData(true);
    },
    [loadData]
  );
  const saveGasto = useCallback(
    async (item) => {
      await gastosService.append(item);
      await loadData(true);
    },
    [loadData]
  );
  const updateIngreso = useCallback(
    async (item) => {
      await ingresosService.update(item);
      await loadData(true);
      flash("✓ Ingreso actualizado");
    },
    [loadData, flash]
  );
  const updateGasto = useCallback(
    async (item) => {
      await gastosService.update(item);
      await loadData(true);
      flash("✓ Gasto actualizado");
    },
    [loadData, flash]
  );
  const removeIngreso = useCallback(
    async (item) => {
      await ingresosService.remove(item._row);
      await loadData(true);
      flash("✓ Ingreso borrado", K.red);
    },
    [loadData, flash]
  );
  const removeGasto = useCallback(
    async (item) => {
      await gastosService.remove(item._row);
      await loadData(true);
      flash("✓ Gasto borrado", K.red);
    },
    [loadData, flash]
  );

  // ── Inventario ──
  const addInventario = useCallback(
    async (it) => {
      await inventarioService.append(it);
      await loadData(true);
      flash("✓ Agregado al inventario", K.purple);
    },
    [loadData, flash]
  );
  const editInventario = useCallback(
    async (it) => {
      await inventarioService.update(it);
      await loadData(true);
      flash("✓ Inventario actualizado", K.purple);
    },
    [loadData, flash]
  );
  const removeInventario = useCallback(
    async (it) => {
      await inventarioService.remove(it._row);
      await loadData(true);
      flash("✓ Borrado del inventario", K.red);
    },
    [loadData, flash]
  );

  // ── Personal (Deuda Valen) ──
  const addDeuda = useCallback(
    async (it) => {
      await deudaPersonalService.append(it);
      await loadData(true);
      flash("✓ Movimiento agregado");
    },
    [loadData, flash]
  );
  const editDeuda = useCallback(
    async (it) => {
      await deudaPersonalService.update(it);
      await loadData(true);
      flash("✓ Movimiento actualizado");
    },
    [loadData, flash]
  );
  const removeDeuda = useCallback(
    async (it) => {
      await deudaPersonalService.remove(it._row);
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
        await ingresosService.update({ ...v, debe: estado });
      }
      const msg = estado === "NO" ? "pagado" : "marcado como debe";
      await loadData(true);
      flash(`✓ ${pendientes.length} ${msg}`);
    },
    [loadData, flash]
  );

  const registrarAbono = useCallback(
    async (cliente, montoNuevo) => {
      await clientesService.registrarAbono(cliente, montoNuevo);
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
