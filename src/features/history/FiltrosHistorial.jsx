import { K, DS } from "../../constants";
import GraficoCircular from "../../shared/charts/GraficoCircular";

const PIE_COLORS = [K.red, K.blue, K.orange, K.purple, K.teal, K.green, "#FF6B6B", "#4ECDC4"];

/**
 * Controles del mes abierto: búsqueda, tabs y filtros de gastos.
 */
function FiltrosHistorial({
  buscar,
  setBuscar,
  filter,
  setFilter,
  categFiltro,
  setCategFiltro,
  orden,
  setOrden,
  gastos,
  catEntries,
  categDisponibles,
}) {
  return (
    <>
      <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="🔍 Buscar..." style={{ width: "100%", background: K.bg, border: `1px solid ${K.border}`, borderRadius: DS.r.sm, color: K.text, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[["ingresos", "Ingresos", K.gold], ["gastos", "Gastos", K.red]].map(([v, l, col]) => (
          <button key={v} onClick={() => { setFilter(v); setCategFiltro(null); }} style={{ flex: 1, background: filter === v ? `${col}22` : "transparent", border: `1px solid ${filter === v ? col : K.border}`, color: filter === v ? col : K.muted, borderRadius: DS.r.sm, padding: "6px 0", fontSize: 11, fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>{l}</button>
        ))}
      </div>
      {filter === "gastos" && gastos > 0 && (
        <>
          <GraficoCircular datos={catEntries} colores={PIE_COLORS} total={gastos} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div style={{ position: "relative" }}>
              <select value={categFiltro || ""} onChange={(e) => setCategFiltro(e.target.value || null)} style={{ width: "100%", background: K.card3, border: `1px solid ${categFiltro ? K.gold : K.border}`, borderRadius: DS.r.sm, color: categFiltro ? K.gold : K.text, padding: "9px 28px 9px 10px", fontSize: 12, outline: "none", WebkitAppearance: "none", appearance: "none", cursor: "pointer" }}>
                <option value="">Todas las categorías</option>
                {categDisponibles.map((cat) => <option key={cat} value={cat} style={{ background: K.card, color: K.text }}>{cat}</option>)}
              </select>
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: K.muted, pointerEvents: "none", fontSize: 10 }}>▾</span>
            </div>
            <div style={{ position: "relative" }}>
              <select value={orden} onChange={(e) => setOrden(e.target.value)} style={{ width: "100%", background: K.card3, border: `1px solid ${K.border}`, borderRadius: DS.r.sm, color: K.text, padding: "9px 28px 9px 10px", fontSize: 12, outline: "none", WebkitAppearance: "none", appearance: "none", cursor: "pointer" }}>
                <option value="fecha">Más reciente</option>
                <option value="monto">Mayor monto</option>
              </select>
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: K.muted, pointerEvents: "none", fontSize: 10 }}>▾</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default FiltrosHistorial;
