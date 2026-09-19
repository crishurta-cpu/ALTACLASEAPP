import { useState } from "react";
import { K, DS } from "../constants";
import IngresoForm from "../features/ingresos/IngresoForm";
import IngresoBloqueForm from "../features/ingresos/IngresoBloqueForm";
import GastoForm from "../features/gastos/GastoForm";
import { useData } from "./hooks/useData";
import { useNav } from "./hooks/useNav";

/**
 * Orquestador de tabs Ingreso/Lote/Gasto dentro del modal de "nuevo
 * movimiento". Cross-feature a propósito (mezcla ingresos y gastos) —
 * vive en app/ desde Fase 17 (antes inline en App.jsx, ver nota de Fase 8).
 * Lee `saveIngreso`/`saveGasto`/`clientes`/`proveedores` y `setShowNuevo`
 * directo de los contextos en vez de recibirlos por props.
 */
export default function NuevoMovimiento() {
  const [modo, setModo] = useState("ingreso");
  const { saveIngreso, saveIngresosLote, saveGasto, clientes, proveedores } = useData();
  const { setShowNuevo } = useNav();

  const onSaveIngreso = async (r) => { await saveIngreso(r); setShowNuevo(false); };
  // Bug real corregido: antes el lote reutilizaba onSaveIngreso, que cierra
  // el modal — con varias filas, el modal se cerraba tras la primera
  // mientras el resto seguia guardandose sin que se viera. Ahora guarda
  // todo el lote y cierra el modal UNA sola vez al terminar.
  const onSaveLote = async (items) => { await saveIngresosLote(items); setShowNuevo(false); };
  const onSaveGasto = async (r) => { await saveGasto(r); setShowNuevo(false); };

  return (
    <div style={{ padding: "24px 16px 0" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button onClick={() => setModo("ingreso")} style={{ flex: 1, background: modo === "ingreso" ? `${K.gold}18` : K.card, border: `1.5px solid ${modo === "ingreso" ? K.gold : K.border}`, color: modo === "ingreso" ? K.gold : K.muted, borderRadius: DS.r.md, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Ingreso</button>
        <button onClick={() => setModo("lote")} style={{ flex: 1, background: modo === "lote" ? `${K.gold}18` : K.card, border: `1.5px solid ${modo === "lote" ? K.gold : K.border}`, color: modo === "lote" ? K.gold : K.muted, borderRadius: DS.r.md, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Lote</button>
        <button onClick={() => setModo("gasto")} style={{ flex: 1, background: modo === "gasto" ? `${K.red}22` : K.card, border: `1.5px solid ${modo === "gasto" ? K.red : K.border}`, color: modo === "gasto" ? K.red : K.muted, borderRadius: DS.r.md, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Gasto</button>
      </div>
      {modo === "ingreso" && <IngresoForm onSave={onSaveIngreso} clientes={clientes} proveedores={proveedores} />}
      {modo === "lote" && <IngresoBloqueForm onSaveLote={onSaveLote} clientes={clientes} />}
      {modo === "gasto" && <GastoForm onSave={onSaveGasto} />}
    </div>
  );
}
