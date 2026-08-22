import { K, DS, fmt } from "../../constants";

/**
 * Fila de cliente dentro de la lista paginada.
 */
function ClientesListItem({ nom, st, onSelect }) {
  return (
    <div style={{ background: st.debe ? "#1C0808" : K.card, border: `1px solid ${st.debe ? K.red + "44" : K.border}`, borderRadius: 16, padding: "14px", marginBottom: 8, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: st.debe ? 8 : 0 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: K.text, marginBottom: 2 }}>
            {nom}{st.debe && <span style={{ marginLeft: 6, fontSize: 9, background: K.red, color: "#fff", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>DEBE</span>}
          </div>
          <div style={{ fontSize: 11, color: K.muted }}>{st.ventas.length} compra{st.ventas.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: K.green }}>{fmt(st.gan)}</div>
            <div style={{ fontSize: 10, color: K.muted }}>ganancia</div>
          </div>
          <button onClick={() => onSelect(nom)} style={{ background: K.card2, border: "none", borderRadius: DS.r.sm, padding: "6px 10px", color: K.muted, fontSize: 12, cursor: "pointer", WebkitTapHighlightColor: "transparent", flexShrink: 0 }}>›</button>
        </div>
      </div>
      {st.debe && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onSelect(nom)} style={{ flex: 1, background: `${K.red}14`, border: `1px solid ${K.red}44`, borderRadius: DS.r.sm, padding: "6px 0", fontSize: 11, fontWeight: 600, color: K.red, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>Ver deuda</button>
          <button onClick={() => onSelect(nom)} style={{ flex: 1, background: `${K.gold}14`, border: `1px solid ${K.gold}44`, borderRadius: DS.r.sm, padding: "6px 0", fontSize: 11, fontWeight: 600, color: K.gold, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>Reporte</button>
        </div>
      )}
    </div>
  );
}

export default ClientesListItem;
