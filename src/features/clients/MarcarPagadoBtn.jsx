import { useState } from "react";
import { K, DS } from "../../constants";

/**
 * Confirma y marca como pagadas todas las ventas pendientes del cliente.
 * Esto siempre salda TODA la deuda del cliente (son "las pendientes", no
 * una selección parcial) — al terminar, `onBack` vuelve a la lista
 * principal de Clientes en vez de dejarte en el detalle de alguien que
 * ya no debe nada.
 */
function MarcarPagadoBtn({ cliente, ventas, onMarcarPagado, onBack }) {
  const [confirmar, setConfirmar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const pendientes = ventas.filter((v) => v.debe === "SI");

  if (pendientes.length === 0) return null;

  const confirmarPago = async () => {
    setCargando(true);
    setError(null);
    try {
      await onMarcarPagado(pendientes);
      setConfirmar(false);
      onBack?.();
    } catch (e) {
      setError("Error al actualizar: " + e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ marginBottom: 14 }}>
      {!confirmar ? (
        <button onClick={() => setConfirmar(true)} style={{ width: "100%", background: `${K.gold}18`, border: `1.5px solid ${K.gold}`, color: K.gold, borderRadius: DS.r.sm, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          ✓ YA PAGÓ ({pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""})
        </button>
      ) : (
        <div style={{ background: K.card, border: `1.5px solid ${K.gold}`, borderRadius: DS.r.sm, padding: 12 }}>
          <div style={{ fontSize: 13, color: K.text, marginBottom: 10, textAlign: "center" }}>¿Confirmar que {cliente} ya pagó las {pendientes.length} compra{pendientes.length !== 1 ? "s" : ""} pendientes?</div>
          {error && <div style={{ color: K.red, fontSize: 12, textAlign: "center", marginBottom: 8 }}>{error}</div>}
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={confirmarPago} disabled={cargando} style={{ flex: 1, background: K.gold, border: "none", color: "#0A0A0A", borderRadius: DS.r.sm, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: cargando ? "not-allowed" : "pointer", opacity: cargando ? 0.6 : 1 }}>
              {cargando ? "⏳ Guardando..." : "Sí, ya pagó"}
            </button>
            <button onClick={() => setConfirmar(false)} disabled={cargando} style={{ flex: 1, background: "transparent", border: `1.5px solid ${K.border}`, color: K.muted, borderRadius: DS.r.sm, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarcarPagadoBtn;
