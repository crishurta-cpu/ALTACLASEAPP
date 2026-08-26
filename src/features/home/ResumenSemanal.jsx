import { K, fmt } from "../../constants";

/**
 * Card "Esta semana" con ganancia, ventas y gastos, más tendencia % vs semana anterior.
 */
function ResumenSemanal({ ganSem, ventasSem, gasSem, tendSem }) {
  return (
    <div style={{ background: K.card, borderRadius: 16, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: K.text }}>Esta semana</div>
        {tendSem !== null && (
          <span style={{ fontSize: 12, fontWeight: 600, color: tendSem >= 0 ? K.green : K.red }}>
            {tendSem >= 0 ? "↑" : "↓"} {Math.abs(tendSem)}%
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {[
          ["Ganancia", fmt(ganSem), K.gold],
          ["Ventas", ventasSem, K.text],
          ["Gastos", fmt(gasSem), K.red],
        ].map(([label, value, color]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: K.muted, fontWeight: 500, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResumenSemanal;
