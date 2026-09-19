import { lazy, Suspense, useState } from "react";
import { K, DS } from "./constants";
import Btn from "./shared/ui/Btn";
import LoginScreen from "./features/auth/LoginScreen";
import ResetPasswordScreen from "./features/auth/ResetPasswordScreen";
import Historial from "./features/history/Historial";
import Clientes from "./features/clients/Clientes";
import Home from "./features/home/Home";
import AppLayout from "./app/AppLayout";
import { useAuth } from "./app/hooks/useAuth";
import { useData } from "./app/hooks/useData";
import { useNav } from "./app/hooks/useNav";

// Sub-tabs de "Más" cargados on-demand (Fase 21): solo se piden al abrir
// esa pestaña, y solo el sub-tab elegido — nadie los necesita en la carga
// inicial (login, Home, Clientes, Historial).
const BusquedaGlobal = lazy(() => import("./features/search/BusquedaGlobal"));
const Inventario = lazy(() => import("./features/inventario/Inventario"));
const Tareas = lazy(() => import("./features/tareas/Tareas"));
const Personal = lazy(() => import("./features/personal/Personal"));
const Configuracion = lazy(() => import("./features/settings/Configuracion"));

const cargandoSubTab = (
  <div style={{ textAlign: "center", color: K.muted, padding: "40px 0", fontSize: 13 }}>Cargando...</div>
);

// ═══ MÁS ═══════════════════════════════════════════════════════
// Sub-tabs de Más (no es un wrapper, tiene estado y dispatch).
function Mas({ db, onEditIngreso, onEditGasto, onAddInv, onEditInv, onDeleteInv, onAddDeuda, onEditDeuda, onDeleteDeuda }) {
  const [v, setV] = useState("clientes");
  const tabs = [["buscar", "🔍", "Buscar"], ["tareas", "🤖", "Tareas"], ["inv", "📦", "Inventario"], ["personal", "📓", "Personal"], ["config", "⚙️", "Config"]];
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>Más</div>
      <div style={{ display: "flex", gap: 0, marginBottom: 16, background: K.card2, borderRadius: DS.r.md, overflow: "hidden", border: `1px solid ${K.border}` }}>
        {tabs.map(([id, icon, label], i) => (
          <button key={id} onClick={() => setV(id)} style={{ flex: 1, background: v === id ? K.card : "transparent", border: "none", color: v === id ? K.text : K.muted, padding: "10px 4px", fontSize: 10, fontWeight: 700, cursor: "pointer", borderRight: i < tabs.length - 1 ? `1px solid ${K.border}` : "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ textTransform: "uppercase", letterSpacing: .5, fontSize: 9 }}>{label}</span>
          </button>
        ))}
      </div>
      <Suspense fallback={cargandoSubTab}>
        {v === "buscar" && <BusquedaGlobal db={db} onEditIngreso={onEditIngreso} onEditGasto={onEditGasto} />}
        {v === "inv" && <Inventario db={db} onAdd={onAddInv} onEdit={onEditInv} onDelete={onDeleteInv} />}
        {v === "tareas" && (<Tareas />)}
        {v === "personal" && <Personal db={db} onAdd={onAddDeuda} onEdit={onEditDeuda} onDelete={onDeleteDeuda} />}
        {v === "config" && <Configuracion />}
      </Suspense>
    </div>
  );
}

export default function App() {
  const { autenticado, passwordRecovery } = useAuth();
  const { tab, setEditIng, setEditGas } = useNav();
  const {
    db, loading, initDone, initError, lastSync, loadData,
    marcarPagado, registrarAbono,
    addInventario, editInventario, removeInventario,
    addDeuda, editDeuda, removeDeuda,
  } = useData();

  // Ojo: al abrir el link de "olvidé mi contraseña" Supabase SI crea sesion
  // (autenticado=true), asi que este check va antes que el de login normal.
  if (passwordRecovery) {
    return <ResetPasswordScreen />;
  }

  if (!autenticado) {
    return <LoginScreen />;
  }

  if (!initDone) {
    return (
      <div style={{ background: K.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: K.text, fontFamily: "-apple-system,sans-serif" }}>
        <span style={{ fontSize: 56 }}>👟</span>
        <div style={{ color: K.gold, fontWeight: 700, fontSize: 18 }}>Altaclase Bodega</div>
        <div style={{ color: K.muted, fontSize: 13 }}>Conectando con Supabase...</div>
        <div style={{ width: 40, height: 4, background: K.border, borderRadius: 2, overflow: "hidden", marginTop: 8 }}>
          <div style={{ width: "60%", height: "100%", background: K.gold, borderRadius: 2 }} />
        </div>
      </div>
    );
  }

  if (initError && db.ingresos.length === 0 && db.gastos.length === 0) {
    return (
      <div style={{ background: K.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, color: K.text, fontFamily: "-apple-system,sans-serif", padding: 24, textAlign: "center" }}>
        <span style={{ fontSize: 48 }}>⚠️</span>
        <div style={{ color: K.red, fontWeight: 700, fontSize: 17 }}>No conectó con Supabase</div>
        <div style={{ color: K.muted, fontSize: 13, maxWidth: 300 }}>{initError}</div>
        <div style={{ maxWidth: 280, width: "100%" }}><Btn label="Reintentar" onClick={() => loadData(false)} loading={loading} /></div>
      </div>
    );
  }

  return (
    <AppLayout>
      {tab === "home" && <Home db={db} onRefresh={() => loadData(false)} loading={loading} lastSync={lastSync} />}
      {tab === "clientes" && <div style={{ padding: "0 0 0" }}><div style={{ padding: "16px 16px 0" }}><div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -.5, marginBottom: 16, color: K.text }}>Clientes</div><Clientes db={db} onEditIngreso={setEditIng} onMarcarPagado={marcarPagado} onRegistrarAbono={registrarAbono} /></div></div>}
      {tab === "historial" && <div style={{ padding: "0 0 0" }}><div style={{ padding: "16px 16px 0" }}><div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -.5, marginBottom: 16, color: K.text }}>Historial</div><Historial db={db} onEditIngreso={setEditIng} onEditGasto={setEditGas} onMarcarPagado={marcarPagado} /></div></div>}
      {tab === "mas" && <Mas db={db} onEditIngreso={setEditIng} onEditGasto={setEditGas} onAddInv={addInventario} onEditInv={editInventario} onDeleteInv={removeInventario} onAddDeuda={addDeuda} onEditDeuda={editDeuda} onDeleteDeuda={removeDeuda} />}
    </AppLayout>
  );
}
