import { useState } from "react";
import { K, DS, fmt } from "../../constants";
import Btn from "../../shared/ui/Btn";
import FInput from "../../shared/ui/FInput";

/**
 * Modal para registrar abonos acumulados en CLIENTES col F.
 */
function AbonoModal({ cliente, abonosActuales, onClose, onRegistrar }) {
  const [monto, setMonto] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const nuevoTotal = (abonosActuales || 0) + (Number(monto) || 0);

  const guardar = async () => {
    if (!Number(monto) || Number(monto) <= 0) {
      setErr("Ingresa un monto válido");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onRegistrar(cliente, nuevoTotal);
      onClose();
    } catch (e) {
      setErr("Error: " + e.message);
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 1000, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: K.bg, width: "100%", maxWidth: 430, margin: "0 auto", borderRadius: "16px 16px 0 0", padding: "18px 16px 32px", border: `1px solid ${K.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: K.muted, textTransform: "uppercase", letterSpacing: 1 }}>Registrar abono</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: K.white }}>{cliente}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: K.muted, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        {abonosActuales > 0 && (
          <div style={{ background: K.card2, borderRadius: DS.r.sm, padding: "10px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: K.muted }}>Abonos anteriores</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: K.green }}>{fmt(abonosActuales)}</span>
          </div>
        )}
        <FInput label="Monto del abono" value={monto} onChange={setMonto} type="number" prefix="$" placeholder="0" />
        {monto && Number(monto) > 0 && (
          <div style={{ background: K.card, border: `1px solid ${K.gold}44`, borderRadius: DS.r.sm, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: K.muted }}>Total abonado quedaría</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: K.gold }}>{fmt(nuevoTotal)}</span>
          </div>
        )}
        {err && <div style={{ color: K.red, fontSize: 12, marginBottom: 8, textAlign: "center" }}>{err}</div>}
        <Btn label="REGISTRAR ABONO" onClick={guardar} loading={saving} dis={!monto || Number(monto) <= 0} />
      </div>
    </div>
  );
}

export default AbonoModal;
