import { K, DS, fmt } from "../../constants";

/**
 * Card premium de Utilidad Neta del mes con glow y margen.
 * Color cambia según signo de `util` (dorado si >=0, rojo si <0).
 */
function UtilidadCard({ util, mrg, ahorro }) {
  const positivo = util >= 0;
  return (
    <div style={{
      background: positivo ? `linear-gradient(135deg,#1A1810 0%,${K.card} 100%)` : `linear-gradient(135deg,#1A0E0E 0%,${K.card} 100%)`,
      borderRadius: DS.r.xl, padding: "24px 20px 20px", marginBottom: 12, textAlign: "center",
      border: `1px solid ${positivo ? K.gold + "22" : K.red + "22"}`,
      boxShadow: positivo ? `0 4px 32px ${K.gold}18` : `0 4px 32px ${K.red}12`,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)", width: 200, height: 100, borderRadius: "50%", background: positivo ? `${K.gold}06` : `${K.red}06`, filter: "blur(30px)" }} />
      <div style={{ fontSize: 11, color: K.muted, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 8 }}>Utilidad Neta del Mes Actual</div>
      <div style={{ fontSize: 48, fontWeight: 700, color: positivo ? K.gold : K.red, letterSpacing: -2, lineHeight: 1, marginBottom: 8 }}>{fmt(util)}</div>
      <div style={{ fontSize: 12, color: K.muted }}>
        Margen <span style={{ color: positivo ? K.gold : K.red, fontWeight: 700 }}>{mrg}%</span>
        {ahorro > 0 && <span style={{ marginLeft: 8 }}>· Ahorro <span style={{ color: K.blue, fontWeight: 600 }}>{fmt(ahorro)}</span></span>}
      </div>
    </div>
  );
}

export default UtilidadCard;
