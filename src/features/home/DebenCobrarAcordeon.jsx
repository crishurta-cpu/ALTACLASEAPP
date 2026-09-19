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
        style={{ width: "100%", background: K.cardGradRed, border: `1px solid ${K.red}33`, borderBottom: abierto ? "none" : `1px solid ${K.red}33`, borderRadius: abierto ? "16px 16px 0 0" : 16, padding: "12px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", WebkitTapHighlightColor: "transparent" }}
      >
        <span style={{ fontSize: 13, color: K.red, fontWeight: 700 }}>
          ⚠ Deben cobrar <span style={{ background: K.red, color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700, marginLeft: 4 }}>{debenList.length}</span>
        </span>
        <span style={{ color: K.red, fontSize: 12 }}>{abierto ? "▲" : "▼"}</span>
      </button>
      {abierto && (
        <div style={{ background: K.cardGradRed, border: `1px solid ${K.red}33`, borderTop: "none", borderRadius: `0 0 ${DS.r.lg}px ${DS.r.lg}px`, padding: "10px 14px" }}>
          {debenList.map((c, i) => (
            <div key={c.cliente} style={{ display: "flex", justifyContent: "space-between", paddingBottom: i < debenList.length - 1 ? 8 : 0, marginBottom: i < debenList.length - 1 ? 8 : 0, borderBottom: i < debenList.length - 1 ? `1px solid ${K.red}22` : "none" }}>
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
