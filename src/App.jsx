import { useState } from "react";
import { K, DS } from "./constants";
import Btn from "./shared/ui/Btn";
import LoginScreen from "./features/auth/LoginScreen";
import Historial from "./features/history/Historial";
import Configuracion from "./features/settings/Configuracion";
import Inventario from "./features/inventario/Inventario";
import Personal from "./features/personal/Personal";
import BusquedaGlobal from "./features/search/BusquedaGlobal";
import Tareas from "./features/tareas/Tareas";
import Clientes from "./features/clients/Clientes";
import Home from "./features/home/Home";
import AppLayout from "./app/AppLayout";
import { useAuth } from "./app/hooks/useAuth";
import { useData } from "./app/hooks/useData";
import { useNav } from "./app/hooks/useNav";

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
      {v === "buscar" && <BusquedaGlobal db={db} onEditIngreso={onEditIngreso} onEditGasto={onEditGasto} />}
      {v === "inv" && <Inventario db={db} onAdd={onAddInv} onEdit={onEditInv} onDelete={onDeleteInv} />}
      {v === "tareas" && (<Tareas />)}
      {v === "personal" && <Personal db={db} onAdd={onAddDeuda} onEdit={onEditDeuda} onDelete={onDeleteDeuda} />}
      {v === "config" && <Configuracion />}
    </div>
  );
}

export default function App() {
  const { autenticado, login } = useAuth();
  const { tab, setTab, setEditIng, setEditGas } = useNav();
  const {
    db, loading, initDone, initError, lastSync, loadData,
    marcarPagado, registrarAbono,
    addInventario, editInventario, removeInventario,
    addDeuda, editDeuda, removeDeuda,
  } = useData();

  if (!autenticado) {
    return <LoginScreen onSuccess={() => { login(); setTab("home"); }} />;
  }

  if (!initDone) {
    return (
      <div style={{ background: K.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: K.text, fontFamily: "-apple-system,sans-serif" }}>
        <span style={{ fontSize: 56 }}>👟</span>
        <div style={{ color: K.gold, fontWeight: 700, fontSize: 18 }}>Altaclase Bodega</div>
        <div style={{ color: K.muted, fontSize: 13 }}>Conectando con Google Sheets...</div>
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
        <div style={{ color: K.red, fontWeight: 700, fontSize: 17 }}>No conectó con Sheets</div>
        <div style={{ color: K.muted, fontSize: 13, maxWidth: 300 }}>{initError}</div>
        <div style={{ maxWidth: 280, width: "100%" }}><Btn label="Reintentar" onClick={() => loadData(false)} loading={loading} /></div>
      </div>
    );
  }

  return (
    <AppLayout>
      {tab === "home" && <Home db={db} onRefresh={() => loadData(false)} loading={loading} lastSync={lastSync} />}
      {tab === "clientes" && <div style={{ padding: "0 0 0" }}><div style={{ padding: "16px 16px 0" }}><div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -.5, marginBottom: 16, color: K.text }}>Clientes</div><Clientes db={db} onEditIngreso={setEditIng} onMarcarPagado={marcarPagado} onRegistrarAbono={registrarAbono} /></div></div>}
      {tab === "historial" && <div style={{ padding: "0 0 0" }}><div style={{ padding: "16px 16px 0" }}><div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -.5, marginBottom: 16, color: K.text }}>Historial</div><Historial db={db} onEditIngreso={setEditIng} onEditGasto={setEditGas} /></div></div>}
      {tab === "mas" && <Mas db={db} onEditIngreso={setEditIng} onEditGasto={setEditGas} onAddInv={addInventario} onEditInv={editInventario} onDeleteInv={removeInventario} onAddDeuda={addDeuda} onEditDeuda={editDeuda} onDeleteDeuda={removeDeuda} />}
    </AppLayout>
  );
}
