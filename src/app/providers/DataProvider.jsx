import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SYNC_INTERVAL_MS, K, cuentaParaListaClientes } from "../../constants";
import { DataContext } from "../contexts/DataContext";
import * as ingresosService from "../../services/supabase/ingresos.service";
import * as gastosService from "../../services/supabase/gastos.service";
import * as inventarioService from "../../services/supabase/inventario.service";
import * as customersService from "../../services/supabase/customers.service";
import * as personalLoansService from "../../services/supabase/personalLoans.service";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

/**
 * Datos de negocio contra Supabase (Fase M5, cutover — reemplaza Google
 * Sheets). Mismo shape de `db` y mismas mutaciones que la version Sheets,
 * para no tener que tocar Home/Historial/Clientes/etc: ver
 * services/supabase/*.service.js, que traducen orders/order_items/
 * other_income/payments/expenses/purchases/personal_loans de vuelta al
 * shape de negocio (cliente, proveedor, costo, precioVenta, debe, ganancia...).
 *
 * `clientesEspeciales` queda vacio a proposito: nada en la UI lo consumia
 * ya en la version Sheets (era dead code, ver esClienteEspecial en constants,
 * que filtra por nombre, no por esta lista).
 */
export function DataProvider({ children }) {
  const { autenticado, organizationId } = useAuth();
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
      if (!organizationId) return;
      if (!silent) setLoading(true);
      try {
        const results = await Promise.allSettled([
          ingresosService.readAll(organizationId),
          gastosService.readAll(organizationId),
          inventarioService.readAll(organizationId),
          customersService.readResumen(organizationId),
          personalLoansService.readAll(organizationId),
        ]);
        const [rIng, rGas, rInv, rCli, rDeuda] = results;

        if (rIng.status === "rejected") throw rIng.reason;
        if (rGas.status === "rejected") throw rGas.reason;

        const ingresos = rIng.value;
        const gastos = rGas.value;
        const inventario = rInv.status === "fulfilled" ? rInv.value : [];
        const clientesResumen = rCli.status === "fulfilled" ? rCli.value : [];
        const deudaPersonal = rDeuda.status === "fulfilled" ? rDeuda.value : [];

        setDb({ ingresos, gastos, inventario, clientesResumen, clientesEspeciales: [], deudaPersonal });
        setLastSync(new Date());
        setInitError(null);
        if (!silent) flash(`✓ ${ingresos.length} ingresos · ${gastos.length} gastos`);
      } catch (e) {
        if (!silent) {
          flash("⚠️ Error conectando con Supabase", K.red);
          setInitError(e.message);
        }
      } finally {
        if (!silent) setLoading(false);
        setInitDone(true);
      }
    },
    [flash, organizationId]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autenticado && organizationId) loadData(false);
  }, [loadData, autenticado, organizationId]);

  useEffect(() => {
    if (!autenticado || !organizationId) return;
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
  }, [loadData, autenticado, organizationId]);

  const saveIngreso = useCallback(
    async (item) => {
      await ingresosService.append(organizationId, item);
      await loadData(true);
    },
    [loadData, organizationId]
  );
  const saveGasto = useCallback(
    async (item) => {
      await gastosService.append(organizationId, item);
      await loadData(true);
    },
    [loadData, organizationId]
  );
  const updateIngreso = useCallback(
    async (item) => {
      await ingresosService.update(organizationId, item);
      await loadData(true);
      flash("✓ Ingreso actualizado");
    },
    [loadData, flash, organizationId]
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
      await inventarioService.append(organizationId, it);
      await loadData(true);
      flash("✓ Agregado al inventario", K.purple);
    },
    [loadData, flash, organizationId]
  );
  const editInventario = useCallback(
    async (it) => {
      await inventarioService.update(organizationId, it);
      await loadData(true);
      flash("✓ Inventario actualizado", K.purple);
    },
    [loadData, flash, organizationId]
  );
  const removeInventario = useCallback(
    async (it) => {
      await inventarioService.remove(it._row);
      await loadData(true);
      flash("✓ Borrado del inventario", K.red);
    },
    [loadData, flash]
  );

  // ── Personal (Deuda Valen / prestamos personales) ──
  const addDeuda = useCallback(
    async (it) => {
      await personalLoansService.append(organizationId, it);
      await loadData(true);
      flash("✓ Movimiento agregado");
    },
    [loadData, flash, organizationId]
  );
  const editDeuda = useCallback(
    async (it) => {
      await personalLoansService.update(organizationId, it);
      await loadData(true);
      flash("✓ Movimiento actualizado");
    },
    [loadData, flash, organizationId]
  );
  const removeDeuda = useCallback(
    async (it) => {
      await personalLoansService.remove(it._row);
      await loadData(true);
      flash("✓ Movimiento borrado", K.red);
    },
    [loadData, flash]
  );

  // ── Marcar pagado: cierra el saldo pendiente de cada ingreso de ese cliente. ──
  const marcarPagado = useCallback(
    async (pendientes, estado = "NO") => {
      for (const v of pendientes) {
        await ingresosService.update(organizationId, { ...v, debe: estado });
      }
      const msg = estado === "NO" ? "pagado" : "marcado como debe";
      await loadData(true);
      flash(`✓ ${pendientes.length} ${msg}`);
    },
    [loadData, flash, organizationId]
  );

  // Abono directo (no ligado a un movimiento de Ingresos): reutiliza el
  // mismo flujo FIFO de RECIBIDO CLIENTE contra las ordenes abiertas.
  const registrarAbono = useCallback(
    async (cliente, montoNuevo) => {
      await ingresosService.append(organizationId, {
        tipo: "RECIBIDO CLIENTE",
        cliente,
        fecha: new Date().toISOString(),
        precioVenta: montoNuevo,
      });
      await loadData(true);
      flash(`✓ Abono de ${cliente} registrado`);
    },
    [loadData, flash, organizationId]
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
