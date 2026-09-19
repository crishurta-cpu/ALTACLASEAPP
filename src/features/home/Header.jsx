import { K, mLabel, curM } from "../../constants";

/**
 * Header premium de la Home: gradiente, glow decorativo, título del mes y botón de sync.
 */
function Header({ onRefresh, loading, lastSync }) {
  const syncTxt = lastSync
    ? lastSync.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : "—";
  return (
    <div style={{
      padding: "56px 20px 24px",
      background: `radial-gradient(ellipse 420px 220px at 85% -15%, ${K.gold}3d 0%, transparent 60%), linear-gradient(165deg, #1D1D20 0%, #0A0A0B 72%)`,
      borderRadius: "0 0 28px 28px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14, flexShrink: 0,
            background: `linear-gradient(145deg, ${K.gold} 0%, ${K.gold}bb 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 18, color: "#0A0A0B",
          }}>A</div>
          <div>
            <div style={{ fontSize: 11, color: "#9A9A9E" }}>Hola,</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: K.white, letterSpacing: -0.3, lineHeight: 1.15 }}>{mLabel(curM())}</div>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Sincronizar"
          style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: loading ? "not-allowed" : "pointer", WebkitTapHighlightColor: "transparent" }}
        >
          <span style={{ fontSize: 16, color: loading ? K.muted : K.white }}>{loading ? "···" : "↻"}</span>
        </button>
      </div>
      <div style={{ fontSize: 10, color: "#8A8A8E", marginTop: 12 }}>Última sincronización · {syncTxt}</div>
    </div>
  );
}

export default Header;
