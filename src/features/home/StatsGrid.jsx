import { K, DS, fmt } from "../../constants";

const STATS = [
  ["Ventas", "ventas", K.gold],
  ["Ganancia", "gan", "#22C55E"],
  ["Gastos", "gastos", K.red],
];

/**
 * Grid de 3 columnas: Ventas / Ganancia / Gastos del mes.
 * Tarjeta con degradado oscuro sutil (revisión 2026-09-19: la primera
 * pasada usaba una tarjeta clara, demasiado contraste contra el resto).
 */
function StatsGrid({ ventas, gan, gastos }) {
  const values = { ventas, gan, gastos };
  return (
    <div style={{ background: K.cardGrad, borderRadius: DS.r.xl, padding: "16px 6px", marginBottom: 12, border: `1px solid ${K.border}`, boxShadow: DS.shadow.md, display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
      {STATS.map(([label, key, color], i) => (
        <div key={label} style={{ textAlign: "center", padding: "0 4px", borderLeft: i > 0 ? `1px solid ${K.border}` : "none" }}>
          <div style={{ fontSize: 9, color: K.muted, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color }}>{fmt(values[key])}</div>
        </div>
      ))}
    </div>
  );
}

export default StatsGrid;
