import { K, DS, CCAT, fmt, fDate, mLabel } from "../../constants";
import FiltrosHistorial from "./FiltrosHistorial";
import useHistorialFilter from "./hooks/useHistorialFilter";

/**
 * Acordeón mensual del historial anual.
 */
function MesAccordion({
  db,
  month,
  isOpen,
  onToggle,
  filter,
  setFilter,
  buscar,
  setBuscar,
  categFiltro,
  setCategFiltro,
  orden,
  setOrden,
  onEditIngreso,
  onEditGasto,
}) {
  const { ventas, gan, gastos, ahorro, util, catEntries, categDisponibles, filtered } = useHistorialFilter(db, month, filter, buscar, categFiltro, orden);

  const resetAndToggle = () => {
    onToggle();
    setFilter("ingresos");
    setBuscar("");
    setCategFiltro(null);
    setOrden("fecha");
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={resetAndToggle} style={{ width: "100%", background: K.card, border: `1px solid ${isOpen ? K.gold + "44" : K.border}`, borderRadius: isOpen ? "14px 14px 0 0" : 14, padding: 14, cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: K.text }}>{mLabel(month)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: util >= 0 ? K.gold : K.red }}>{fmt(util)}</div>
            <span style={{ color: K.muted, fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
          {[["Ventas", ventas, K.gold], ["Gan.", gan, K.green], ["Gastos", gastos, K.red], ["Ahorro", ahorro, K.blue]].map(([l, v, col]) => (
            <div key={l} style={{ background: K.bg, borderRadius: DS.r.sm, padding: "5px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 8, color: K.muted, textTransform: "uppercase" }}>{l}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: col }}>{fmt(v)}</div>
            </div>
          ))}
        </div>
      </button>
      {isOpen && (
        <div style={{ background: K.card2, border: `1px solid ${K.border}`, borderTop: "none", borderRadius: `0 0 ${DS.r.lg}px ${DS.r.lg}px`, padding: 12 }}>
          <FiltrosHistorial
            buscar={buscar}
            setBuscar={setBuscar}
            filter={filter}
            setFilter={setFilter}
            categFiltro={categFiltro}
            setCategFiltro={setCategFiltro}
            orden={orden}
            setOrden={setOrden}
            gastos={gastos}
            catEntries={catEntries}
            categDisponibles={categDisponibles}
          />
          {filtered.length === 0 && <div style={{ textAlign: "center", color: K.muted, padding: 16, fontSize: 13 }}>Sin registros</div>}
          {filtered.map((item, i) => {
            const isI = filter === "ingresos";
            const val = isI ? item.ganancia : item.costo;
            const col = isI ? (val >= 0 ? K.gold : K.muted) : CCAT[item.concepto] || K.red;
            return (
              <button key={i} onClick={() => (isI ? onEditIngreso(item) : onEditGasto(item))} style={{ width: "100%", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < filtered.length - 1 ? `0.5px solid ${K.border}` : "none", cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: K.text }}>{isI ? item.producto || item.tipo : item.referencia}</div>
                  <div style={{ fontSize: 11, color: K.muted }}>{isI ? `${item.tipo}${item.cliente ? " · " + item.cliente : ""}` : item.concepto} · {fDate(item.fecha)}</div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: col }}>{isI ? (val >= 0 ? "+" : "") + fmt(val) : "-" + fmt(val)}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MesAccordion;
