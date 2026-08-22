import { K } from "../../constants";
import Card from "../../shared/ui/Card";
import SwipeableVenta from "./SwipeableVenta";

/**
 * Historial paginado de ventas del cliente, con swipe para cambiar deuda.
 */
function ClienteHistorial({ ventasFiltradas, pagH, setPagH, onEditIngreso, onMarcarPagado }) {
  const sortedV = [...ventasFiltradas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const totalPH = Math.max(1, Math.ceil(sortedV.length / 10));
  const paginaHistorial = Math.min(pagH, totalPH);
  const sliceV = sortedV.slice((paginaHistorial - 1) * 10, paginaHistorial * 10);

  return (
    <Card
      ch={
        <>
          <div style={{ fontSize: 10, color: K.gold, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 700 }}>Historial ({ventasFiltradas.length}) · desliza para cambiar deuda</div>
          {sliceV.length === 0 && <div style={{ textAlign: "center", color: K.muted, padding: 16, fontSize: 13 }}>Sin compras este período</div>}
          {sliceV.map((v, i, arr) => {
            const debe = v.debe === "SI";
            return <SwipeableVenta key={v._row || i} v={v} debe={debe} onEdit={() => onEditIngreso(v)} onToggleDebe={(estado) => onMarcarPagado([v], estado)} isLast={i === arr.length - 1} />;
          })}
          {totalPH > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${K.border}` }}>
              <button onClick={() => setPagH((p) => Math.max(1, p - 1))} disabled={pagH <= 1} style={{ background: "none", border: `1px solid ${K.border}`, color: pagH <= 1 ? K.muted : K.text, borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", opacity: pagH <= 1 ? 0.4 : 1 }}>‹</button>
              <span style={{ fontSize: 11, color: K.muted }}>{paginaHistorial}/{totalPH}</span>
              <button onClick={() => setPagH((p) => Math.min(totalPH, p + 1))} disabled={pagH >= totalPH} style={{ background: "none", border: `1px solid ${K.border}`, color: pagH >= totalPH ? K.muted : K.text, borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", opacity: pagH >= totalPH ? 0.4 : 1 }}>›</button>
            </div>
          )}
        </>
      }
    />
  );
}

export default ClienteHistorial;
