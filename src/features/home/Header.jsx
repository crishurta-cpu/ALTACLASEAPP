import { K, DS, mLabel, curM } from "../../constants";

/**
 * Header premium de la Home: gradiente, glow decorativo, título del mes y botón de sync.
 */
function Header({ onRefresh, loading, lastSync }) {
  const syncTxt = lastSync
    ? lastSync.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : "—";
  return (
    <div style={{
      padding: "56px 20px 20px",
      background: `linear-gradient(160deg, #16161F 0%, #0D0D12 100%)`,
      borderBottom: `1px solid ${K.border}`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -40, right: -20, width: 160, height: 160, borderRadius: "50%", background: `${K.gold}08`, filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div>
          <div style={{ fontSize: 10, color: K.gold, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 4, opacity: 0.8 }}>Altaclase Bodega</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: K.white, letterSpacing: -0.8, lineHeight: 1 }}>{mLabel(curM())}</div>
          <div style={{ fontSize: 11, color: K.muted, marginTop: 4 }}>Sync {syncTxt}</div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{ background: K.card3, border: `1px solid ${K.border}`, borderRadius: DS.r.sm, padding: "8px 14px", color: loading ? K.muted : K.gold, fontSize: 12, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", WebkitTapHighlightColor: "transparent", boxShadow: DS.shadow.sm }}
        >
          {loading ? "···" : "↻ Sync"}
        </button>
      </div>
    </div>
  );
}

export default Header;
