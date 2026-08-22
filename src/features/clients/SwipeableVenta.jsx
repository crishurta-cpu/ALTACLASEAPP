import { useRef, useState } from "react";
import { K, DS, fmt, fDate } from "../../constants";

/**
 * Fila táctil de venta con swipe bidireccional.
 *
 * Regla crítica:
 * - Swipe izquierda llama onToggleDebe("NO").
 * - Swipe derecha llama onToggleDebe("SI").
 * - Tap abre edición.
 */
function SwipeableVenta({ v, debe, onEdit, onToggleDebe, isLast }) {
  const startX = useRef(null);
  const startY = useRef(null);
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const THRESHOLD = 72;

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setSwiping(false);
    setOffsetX(0);
  };

  const onTouchMove = (e) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (!swiping && Math.abs(dy) > Math.abs(dx) * 1.5) return;
    setSwiping(true);
    setOffsetX(Math.max(-130, Math.min(130, dx)));
  };

  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - (startX.current || 0);
    const dy = e.changedTouches[0].clientY - (startY.current || 0);
    const wasSwiping = swiping;
    startX.current = null;
    startY.current = null;
    setSwiping(false);
    setOffsetX(0);
    if (!wasSwiping && Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      onEdit();
      return;
    }
    if (dx < -THRESHOLD) onToggleDebe("NO");
    if (dx > THRESHOLD) onToggleDebe("SI");
  };

  const actionColor = offsetX < -THRESHOLD ? K.green : K.red;

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: DS.r.md, marginBottom: isLast ? 0 : 8 }}>
      {swiping && Math.abs(offsetX) > 20 && (
        <div style={{ position: "absolute", inset: 0, background: offsetX < 0 ? `${K.green}22` : `${K.red}22`, display: "flex", alignItems: "center", justifyContent: offsetX < 0 ? "flex-end" : "flex-start", padding: "0 20px", borderRadius: DS.r.md }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: actionColor, letterSpacing: 0.5 }}>
            {offsetX < 0 ? "✓ NO DEBE" : "⚠ DEBE"}
          </span>
        </div>
      )}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${offsetX}px)`, transition: swiping ? "none" : "transform .25s cubic-bezier(.4,0,.2,1)", background: debe ? "#2C0A0A" : K.card2, borderRadius: DS.r.md, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none", WebkitUserSelect: "none", WebkitTapHighlightColor: "transparent", willChange: "transform" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: K.text, display: "flex", alignItems: "center", gap: 8 }}>
            {v.producto}
            {debe && <span style={{ fontSize: 10, background: K.red, color: "#fff", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>DEBE</span>}
          </div>
          <div style={{ fontSize: 13, color: K.muted, marginTop: 3 }}>{v.tipo} · {fDate(v.fecha)}</div>
        </div>
        <div style={{ textAlign: "right", marginLeft: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: K.gold }}>+{fmt(v.ganancia)}</div>
          <div style={{ fontSize: 13, color: debe ? K.red : K.muted }}>{fmt(v.precioVenta)}</div>
        </div>
      </div>
    </div>
  );
}

export default SwipeableVenta;
