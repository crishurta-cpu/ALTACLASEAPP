import { K, DS, CCAT, fmt, fDate } from "../../constants";

/**
 * Acordeón "Últimos gastos" con los 5 gastos más recientes.
 * Estado abierto/cerrado controlado por el padre (Home.jsx).
 */
function UltimosGastosAcordeon({ ultimosGastos, abierto, onToggle }) {
  if (ultimosGastos.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={onToggle}
        style={{ width: "100%", background: K.card, border: `0.5px solid ${K.border}`, borderRadius: abierto ? "12px 12px 0 0" : 12, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", WebkitTapHighlightColor: "transparent" }}
      >
        <span style={{ fontSize: 13, color: K.muted, fontWeight: 600 }}>Últimos gastos</span>
        <span style={{ color: K.muted, fontSize: 12 }}>{abierto ? "▲" : "▼"}</span>
      </button>
      {abierto && (
        <div style={{ background: K.card, border: `0.5px solid ${K.border}`, borderTop: "none", borderRadius: `0 0 ${DS.r.md}px ${DS.r.md}px`, padding: "10px 14px" }}>
          {ultimosGastos.map((g, i) => (
            <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: i < ultimosGastos.length - 1 ? 9 : 0, marginBottom: i < ultimosGastos.length - 1 ? 9 : 0, borderBottom: i < ultimosGastos.length - 1 ? `0.5px solid ${K.border}` : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: K.text }}>{g.referencia}</div>
                <div style={{ fontSize: 11, color: K.muted }}>{g.concepto} · {fDate(g.fecha)}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: CCAT[g.concepto] || K.red, marginLeft: 8 }}>-{fmt(g.costo)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UltimosGastosAcordeon;
