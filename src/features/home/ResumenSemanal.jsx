import { K, DS, fmt } from "../../constants";

/**
 * Card "Esta semana" con ganancia, ventas y gastos, más tendencia % vs semana anterior.
 * Tarjeta clara — misma familia visual que StatsGrid.
 */
function ResumenSemanal({ ganSem, ventasSem, gasSem, tendSem }) {
  return (
    <div style={{ background: K.light, borderRadius: DS.r.lg, padding: "14px 16px", marginBottom: 10, boxShadow: "0 8px 20px rgba(0,0,0,.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: K.ink }}>Esta semana</div>
        {tendSem !== null && (
          <span style={{ fontSize: 12, fontWeight: 600, color: tendSem >= 0 ? "#17A34A" : K.red }}>
            {tendSem >= 0 ? "↑" : "↓"} {Math.abs(tendSem)}%
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {[
          ["Ganancia", fmt(ganSem), K.gold],
          ["Ventas", ventasSem, K.ink],
          ["Gastos", fmt(gasSem), K.red],
        ].map(([label, value, color]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: K.inkMuted, fontWeight: 600, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResumenSemanal;
