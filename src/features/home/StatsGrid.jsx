import { K, DS, fmt } from "../../constants";

const STATS = [
  ["Ventas", "ventas", K.gold],
  ["Ganancia", "gan", "#17A34A"],
  ["Gastos", "gastos", K.inkMuted],
];

/**
 * Grid de 3 columnas: Ventas / Ganancia / Gastos del mes.
 * Tarjeta clara flotante, al estilo del panel de acciones rápidas de la
 * referencia visual (contraste con el hero oscuro de arriba).
 */
function StatsGrid({ ventas, gan, gastos }) {
  const values = { ventas, gan, gastos };
  return (
    <div style={{ background: K.light, borderRadius: DS.r.xl, padding: "16px 6px", marginBottom: 12, boxShadow: "0 12px 28px rgba(0,0,0,.3)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
      {STATS.map(([label, key, color], i) => (
        <div key={label} style={{ textAlign: "center", padding: "0 4px", borderLeft: i > 0 ? `1px solid ${K.lightBorder}` : "none" }}>
          <div style={{ fontSize: 9, color: K.inkMuted, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color }}>{fmt(values[key])}</div>
        </div>
      ))}
    </div>
  );
}

export default StatsGrid;
