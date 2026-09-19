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

  // Recargas parciales: cada mutacion solo trae de vuelta el pedazo de `db`
  // que en verdad pudo cambiar, en vez de las 5 consultas completas de
  // `loadData`. Ingresos SIEMPRE trae tambien clientesResumen porque el
  // saldo de un cliente depende de ordenes+pagos (v_customer_balances).
  const reloadIngresos = useCallback(async () => {
    if (!organizationId) return;
    const [ingresos, clientesResumen] = await Promise.all([
      ingresosService.readAll(organizationId),
      customersService.readResumen(organizationId),
    ]);
    setDb((prev) => ({ ...prev, ingresos, clientesResumen }));
    setLastSync(new Date());
  }, [organizationId]);

  const reloadGastos = useCallback(async () => {
    if (!organizationId) return;
    const gastos = await gastosService.readAll(organizationId);
    setDb((prev) => ({ ...prev, gastos }));
    setLastSync(new Date());
  }, [organizationId]);

  const reloadInventario = useCallback(async () => {
    if (!organizationId) return;
    const inventario = await inventarioService.readAll(organizationId);
    setDb((prev) => ({ ...prev, inventario }));
    setLastSync(new Date());
  }, [organizationId]);

  const reloadDeuda = useCallback(async () => {
    if (!organizationId) return;
    const deudaPersonal = await personalLoansService.readAll(organizationId);
    setDb((prev) => ({ ...prev, deudaPersonal }));
    setLastSync(new Date());
  }, [organizationId]);

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
      await reloadIngresos();
    },
    [reloadIngresos, organizationId]
  );

  // Lote: guarda todas las filas EN SERIE (ver appendMany) y recarga UNA
  // sola vez al final — antes cada fila del lote disparaba su propio
  // loadData(true) completo (5 consultas x N filas). Si alguna fila falla,
  // las demas ya guardadas quedan guardadas; se avisa cuales fallaron.
  const saveIngresosLote = useCallback(
    async (items) => {
      const { ok, fallidas } = await ingresosService.appendMany(organizationId, items);
      await reloadIngresos();
      if (fallidas.length > 0) {
        flash(`⚠️ ${ok} guardadas, ${fallidas.length} fallaron`, K.red);
        throw new Error(fallidas.map((f) => f.error).join(" · "));
      }
      flash(`✓ ${ok} ventas guardadas`);
    },
    [reloadIngresos, flash, organizationId]
  );

  const saveGasto = useCallback(
    async (item) => {
      await gastosService.append(organizationId, item);
      await reloadGastos();
    },
    [reloadGastos, organizationId]
  );
  const updateIngreso = useCallback(
    async (item) => {
      await ingresosService.update(organizationId, item);
      await reloadIngresos();
      flash("✓ Ingreso actualizado");
    },
    [reloadIngresos, flash, organizationId]
  );
  const updateGasto = useCallback(
    async (item) => {
      await gastosService.update(item);
      await reloadGastos();
      flash("✓ Gasto actualizado");
    },
    [reloadGastos, flash]
  );
  const removeIngreso = useCallback(
    async (item) => {
      await ingresosService.remove(item._row);
      await reloadIngresos();
      flash("✓ Ingreso borrado", K.red);
    },
    [reloadIngresos, flash]
  );
  const removeGasto = useCallback(
    async (item) => {
      await gastosService.remove(item._row);
      await reloadGastos();
      flash("✓ Gasto borrado", K.red);
    },
    [reloadGastos, flash]
  );

  // ── Inventario ──
  const addInventario = useCallback(
    async (it) => {
      await inventarioService.append(organizationId, it);
      await reloadInventario();
      flash("✓ Agregado al inventario", K.purple);
    },
    [reloadInventario, flash, organizationId]
  );
  const editInventario = useCallback(
    async (it) => {
      await inventarioService.update(organizationId, it);
      await reloadInventario();
      flash("✓ Inventario actualizado", K.purple);
    },
    [reloadInventario, flash, organizationId]
  );
  const removeInventario = useCallback(
    async (it) => {
      await inventarioService.remove(it._row);
      await reloadInventario();
      flash("✓ Borrado del inventario", K.red);
    },
    [reloadInventario, flash]
  );

  // ── Personal (Deuda Valen / prestamos personales) ──
  const addDeuda = useCallback(
    async (it) => {
      await personalLoansService.append(organizationId, it);
      await reloadDeuda();
      flash("✓ Movimiento agregado");
    },
    [reloadDeuda, flash, organizationId]
  );
  const editDeuda = useCallback(
    async (it) => {
      await personalLoansService.update(organizationId, it);
      await reloadDeuda();
      flash("✓ Movimiento actualizado");
    },
    [reloadDeuda, flash, organizationId]
  );
  const removeDeuda = useCallback(
    async (it) => {
      await personalLoansService.remove(it._row);
      await reloadDeuda();
      flash("✓ Movimiento borrado", K.red);
    },
    [reloadDeuda, flash]
  );

  // ── Marcar pagado: cierra el saldo pendiente de cada ingreso de ese cliente. ──
  const marcarPagado = useCallback(
    async (pendientes, estado = "NO") => {
      for (const v of pendientes) {
        await ingresosService.update(organizationId, { ...v, debe: estado });
      }
      const msg = estado === "NO" ? "pagado" : "marcado como debe";
      await reloadIngresos();
      flash(`✓ ${pendientes.length} ${msg}`);
    },
    [reloadIngresos, flash, organizationId]
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
      await reloadIngresos();
      flash(`✓ Abono de ${cliente} registrado`);
    },
    [reloadIngresos, flash, organizationId]
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
      saveIngresosLote,
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
      saveIngresosLote,
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
