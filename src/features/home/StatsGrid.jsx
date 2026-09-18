import { K, DS, fmt } from "../../constants";

const STATS = [
  ["Ventas", "ventas", K.gold],
  ["Ganancia", "gan", K.green],
  ["Gastos", "gastos", K.red],
];

/**
 * Grid de 3 columnas: Ventas / Ganancia / Gastos del mes.
 */
function StatsGrid({ ventas, gan, gastos }) {
  const values = { ventas, gan, gastos };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
      {STATS.map(([label, key, color]) => (
        <div key={label} style={{ background: K.card2, borderRadius: DS.r.md, padding: "14px 8px", textAlign: "center", border: `1px solid ${K.border}`, boxShadow: DS.shadow.sm }}>
          <div style={{ fontSize: 9, color: K.muted, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color }}>{fmt(values[key])}</div>
        </div>
      ))}
    </div>
  );
}

export default StatsGrid;
