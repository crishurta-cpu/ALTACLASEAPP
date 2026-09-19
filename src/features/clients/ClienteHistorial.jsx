import { useCallback, useState } from "react";
import { K, DS } from "../../constants";
import Card from "../../shared/ui/Card";
import SwipeableVenta from "./SwipeableVenta";

/**
 * Historial paginado de ventas del cliente, con swipe para cambiar deuda.
 *
 * Selección múltiple (2026-09-19): la edición en bloque de movimientos
 * (pagado/pendiente/borrar) vive SOLO aquí, dentro de cada cliente — no en
 * el Historial general. "Seleccionar" activa checkboxes (y desactiva el
 * swipe, para no confundir gestos); con algo seleccionado aparece la barra
 * de acciones en bloque.
 *
 * `handleEdit`/`handleToggleDebe` están envueltos en `useCallback` (Fase 21)
 * para que sean referencias estables entre renders — necesario para que el
 * `React.memo` de `SwipeableVenta` funcione de verdad.
 */
function ClienteHistorial({ ventasFiltradas, pagH, setPagH, onEditIngreso, onMarcarPagado, onEliminarIngresos }) {
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  const handleEdit = useCallback((v) => onEditIngreso(v), [onEditIngreso]);
  const handleToggleDebe = useCallback((v, estado) => onMarcarPagado([v], estado), [onMarcarPagado]);
  const toggleSeleccion = useCallback((v) => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(v._row)) next.delete(v._row);
      else next.add(v._row);
      return next;
    });
  }, []);

  const sortedV = [...ventasFiltradas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const totalPH = Math.max(1, Math.ceil(sortedV.length / 10));
  const paginaHistorial = Math.min(pagH, totalPH);
  const sliceV = sortedV.slice((paginaHistorial - 1) * 10, paginaHistorial * 10);

  const salirSeleccion = () => {
    setModoSeleccion(false);
    setSeleccion(new Set());
    setConfirmarBorrado(false);
  };

  const aplicarEstado = async (estado) => {
    const items = sortedV.filter((v) => seleccion.has(v._row));
    if (items.length === 0) return;
    await onMarcarPagado(items, estado);
    salirSeleccion();
  };

  const eliminarSeleccion = async () => {
    const items = sortedV.filter((v) => seleccion.has(v._row));
    if (items.length === 0) return;
    await onEliminarIngresos(items);
    salirSeleccion();
  };

  return (
    <Card
      ch={
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: K.gold, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>
              Historial ({ventasFiltradas.length}) {!modoSeleccion && "· desliza para cambiar deuda"}
            </div>
            {ventasFiltradas.length > 0 && (
              <button
                onClick={() => (modoSeleccion ? salirSeleccion() : setModoSeleccion(true))}
                style={{ background: modoSeleccion ? `${K.gold}18` : "transparent", border: `1px solid ${modoSeleccion ? K.gold + "55" : K.border}`, color: modoSeleccion ? K.gold : K.muted, borderRadius: DS.r.sm, padding: "4px 10px", fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
              >
                {modoSeleccion ? "Cancelar" : "Seleccionar"}
              </button>
            )}
          </div>
          {sliceV.length === 0 && <div style={{ textAlign: "center", color: K.muted, padding: 16, fontSize: 13 }}>Sin compras este período</div>}
          {sliceV.map((v, i, arr) => {
            const debe = v.debe === "SI";
            return (
              <SwipeableVenta
                key={v._row || i}
                v={v}
                debe={debe}
                onEdit={handleEdit}
                onToggleDebe={handleToggleDebe}
                isLast={i === arr.length - 1}
                seleccionable={modoSeleccion}
                seleccionada={seleccion.has(v._row)}
                onToggleSeleccion={toggleSeleccion}
              />
            );
          })}
          {totalPH > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${K.border}` }}>
              <button onClick={() => setPagH((p) => Math.max(1, p - 1))} disabled={pagH <= 1} style={{ background: "none", border: `1px solid ${K.border}`, color: pagH <= 1 ? K.muted : K.text, borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", opacity: pagH <= 1 ? 0.4 : 1 }}>‹</button>
              <span style={{ fontSize: 11, color: K.muted }}>{paginaHistorial}/{totalPH}</span>
              <button onClick={() => setPagH((p) => Math.min(totalPH, p + 1))} disabled={pagH >= totalPH} style={{ background: "none", border: `1px solid ${K.border}`, color: pagH >= totalPH ? K.muted : K.text, borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", opacity: pagH >= totalPH ? 0.4 : 1 }}>›</button>
            </div>
          )}
          {modoSeleccion && seleccion.size > 0 && !confirmarBorrado && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${K.border}` }}>
              <button onClick={() => aplicarEstado("NO")} style={{ flex: 1, minWidth: 100, background: `${K.green}18`, border: `1px solid ${K.green}44`, color: K.green, borderRadius: DS.r.sm, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                ✓ Pagado ({seleccion.size})
              </button>
              <button onClick={() => aplicarEstado("SI")} style={{ flex: 1, minWidth: 100, background: `${K.red}18`, border: `1px solid ${K.red}44`, color: K.red, borderRadius: DS.r.sm, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                ⚠ Debe ({seleccion.size})
              </button>
              <button onClick={() => setConfirmarBorrado(true)} style={{ flex: 1, minWidth: 100, background: "transparent", border: `1px solid ${K.border}`, color: K.muted, borderRadius: DS.r.sm, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                🗑️ Eliminar ({seleccion.size})
              </button>
            </div>
          )}
          {confirmarBorrado && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${K.border}` }}>
              <div style={{ flex: 1, fontSize: 12, color: K.red, display: "flex", alignItems: "center" }}>¿Borrar {seleccion.size} movimiento{seleccion.size !== 1 ? "s" : ""}? No se puede deshacer.</div>
              <button onClick={() => setConfirmarBorrado(false)} style={{ background: "none", border: `1px solid ${K.border}`, color: K.muted, borderRadius: DS.r.sm, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              <button onClick={eliminarSeleccion} style={{ background: K.red, border: "none", color: "#fff", borderRadius: DS.r.sm, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Confirmar</button>
            </div>
          )}
        </>
      }
    />
  );
}

export default ClienteHistorial;
