import { K, DS, fmt } from "../../constants";

/**
 * Acordeón "⚠ Deben cobrar" con la lista de clientes que tienen deuda pendiente.
 * Estado abierto/cerrado controlado por el padre (Home.jsx).
 */
function DebenCobrarAcordeon({ debenList, abierto, onToggle }) {
  if (debenList.length === 0) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={onToggle}
        style={{ width: "100%", background: "#1C0808", border: `0.5px solid ${K.red}55`, borderRadius: abierto ? "12px 12px 0 0" : 12, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", WebkitTapHighlightColor: "transparent" }}
      >
        <span style={{ fontSize: 13, color: K.red, fontWeight: 600 }}>
          ⚠ Deben cobrar <span style={{ background: K.red, color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700, marginLeft: 4 }}>{debenList.length}</span>
        </span>
        <span style={{ color: K.muted, fontSize: 12 }}>{abierto ? "▲" : "▼"}</span>
      </button>
      {abierto && (
        <div style={{ background: "#160606", border: `0.5px solid ${K.red}55`, borderTop: "none", borderRadius: `0 0 ${DS.r.md}px ${DS.r.md}px`, padding: "10px 14px" }}>
          {debenList.map((c, i) => (
            <div key={c.cliente} style={{ display: "flex", justifyContent: "space-between", paddingBottom: i < debenList.length - 1 ? 8 : 0, marginBottom: i < debenList.length - 1 ? 8 : 0, borderBottom: i < debenList.length - 1 ? `0.5px solid ${K.red}22` : "none" }}>
              <span style={{ fontSize: 13, color: K.text }}>{c.cliente}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: K.red }}>{fmt(c.saldo)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DebenCobrarAcordeon;
