import { memo } from "react";
import { K, DS, fmt } from "../../constants";

/**
 * Fila de cliente dentro de la lista paginada.
 * Envuelto en `React.memo` (Fase 21): `onSelect` ya es una referencia
 * estable (`setSel`, un setState) desde `Clientes.jsx`, así que memo evita
 * re-renderizar cada fila cuando solo cambia la búsqueda/paginación y el
 * `map` de origen no cambió.
 */
function ClientesListItem({ nom, st, onSelect }) {
  return (
    <div style={{ background: st.debe ? "#FBECEA" : K.light, borderRadius: DS.r.lg, padding: "14px", marginBottom: 8, position: "relative", boxShadow: "0 6px 16px rgba(0,0,0,.2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: st.debe ? 8 : 0 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: K.ink, marginBottom: 2 }}>
            {nom}{st.debe && <span style={{ marginLeft: 6, fontSize: 9, background: K.red, color: "#fff", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>DEBE</span>}
          </div>
          <div style={{ fontSize: 11, color: K.inkMuted }}>{st.ventas.length} compra{st.ventas.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#17A34A" }}>{fmt(st.gan)}</div>
            <div style={{ fontSize: 10, color: K.inkMuted }}>ganancia</div>
          </div>
          <button onClick={() => onSelect(nom)} style={{ background: K.lightBorder, border: "none", borderRadius: DS.r.sm, padding: "6px 10px", color: K.inkMuted, fontSize: 12, cursor: "pointer", WebkitTapHighlightColor: "transparent", flexShrink: 0 }}>›</button>
        </div>
      </div>
      {st.debe && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onSelect(nom)} style={{ flex: 1, background: "#F5D5D0", border: "none", borderRadius: DS.r.sm, padding: "6px 0", fontSize: 11, fontWeight: 700, color: "#B91C1C", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>Ver deuda</button>
          <button onClick={() => onSelect(nom)} style={{ flex: 1, background: `${K.gold}22`, border: "none", borderRadius: DS.r.sm, padding: "6px 0", fontSize: 11, fontWeight: 700, color: K.gold, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>Reporte</button>
        </div>
      )}
    </div>
  );
}

export default memo(ClientesListItem);
