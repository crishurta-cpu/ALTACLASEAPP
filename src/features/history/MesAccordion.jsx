import { useState } from "react";
import { K, DS, CCAT, fmt, fDate, mLabel } from "../../constants";
import FiltrosHistorial from "./FiltrosHistorial";
import useHistorialFilter from "./hooks/useHistorialFilter";

/**
 * Acordeón mensual del historial anual.
 *
 * Selección múltiple (2026-09-19): solo disponible con filter==="ingresos"
 * (pagado/pendiente es un concepto de ingresos, no de gastos). "Seleccionar"
 * activa checkboxes en vez de abrir edición al tocar una fila; con algo
 * seleccionado aparece la barra para marcar pagado/pendiente en bloque
 * (reusa `onMarcarPagado`, la misma función de MarcarPagadoBtn).
 */
function MesAccordion({
  db,
  month,
  isOpen,
  onToggle,
  filter,
  setFilter,
  buscar,
  setBuscar,
  categFiltro,
  setCategFiltro,
  orden,
  setOrden,
  onEditIngreso,
  onEditGasto,
  onMarcarPagado,
}) {
  const { ventas, gan, gastos, ahorro, util, catEntries, categDisponibles, filtered } = useHistorialFilter(db, month, filter, buscar, categFiltro, orden);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccion, setSeleccion] = useState(() => new Set());

  const resetAndToggle = () => {
    onToggle();
    setFilter("ingresos");
    setBuscar("");
    setCategFiltro(null);
    setOrden("fecha");
    setModoSeleccion(false);
    setSeleccion(new Set());
  };

  const toggleSeleccion = (row) => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(row)) next.delete(row);
      else next.add(row);
      return next;
    });
  };

  const aplicarEstado = async (estado) => {
    const items = filtered.filter((it) => seleccion.has(it._row));
    if (items.length === 0) return;
    await onMarcarPagado(items, estado);
    setSeleccion(new Set());
    setModoSeleccion(false);
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <button onClick={resetAndToggle} style={{ width: "100%", background: K.cardGrad, border: `1px solid ${K.border}`, borderBottom: isOpen ? "none" : `1px solid ${K.border}`, borderRadius: isOpen ? "16px 16px 0 0" : 16, padding: 14, cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: K.text }}>{mLabel(month)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: util >= 0 ? K.gold : K.red }}>{fmt(util)}</div>
            <span style={{ color: K.muted, fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
          {[["Ventas", ventas, K.gold], ["Gan.", gan, "#22C55E"], ["Gastos", gastos, K.red], ["Ahorro", ahorro, K.blue]].map(([l, v, col]) => (
            <div key={l} style={{ background: K.card3, borderRadius: DS.r.sm, padding: "5px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 8, color: K.muted, textTransform: "uppercase" }}>{l}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: col }}>{fmt(v)}</div>
            </div>
          ))}
        </div>
      </button>
      {isOpen && (
        <div style={{ background: K.cardGrad, border: `1px solid ${K.border}`, borderTop: "none", borderRadius: `0 0 ${DS.r.lg}px ${DS.r.lg}px`, padding: 12 }}>
          <FiltrosHistorial
            buscar={buscar}
            setBuscar={setBuscar}
            filter={filter}
            setFilter={setFilter}
            categFiltro={categFiltro}
            setCategFiltro={setCategFiltro}
            orden={orden}
            setOrden={setOrden}
            gastos={gastos}
            catEntries={catEntries}
            categDisponibles={categDisponibles}
          />

          {filter === "ingresos" && filtered.length > 0 && onMarcarPagado && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button
                onClick={() => {
                  setModoSeleccion((v) => !v);
                  setSeleccion(new Set());
                }}
                style={{ background: modoSeleccion ? `${K.gold}18` : "transparent", border: `1px solid ${modoSeleccion ? K.gold + "55" : K.border}`, color: modoSeleccion ? K.gold : K.muted, borderRadius: DS.r.sm, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                {modoSeleccion ? "Cancelar" : "Seleccionar"}
              </button>
            </div>
          )}

          {filtered.length === 0 && <div style={{ textAlign: "center", color: K.muted, padding: 16, fontSize: 13 }}>Sin registros</div>}
          {filtered.map((item, i) => {
            const isI = filter === "ingresos";
            const val = isI ? item.ganancia : item.costo;
            const col = isI ? (val >= 0 ? K.gold : K.muted) : CCAT[item.concepto] || K.red;
            const marcada = seleccion.has(item._row);
            return (
              <button
                key={i}
                onClick={() => (modoSeleccion ? toggleSeleccion(item._row) : isI ? onEditIngreso(item) : onEditGasto(item))}
                style={{ width: "100%", background: marcada ? `${K.gold}14` : "none", border: "none", display: "flex", alignItems: "center", gap: 10, padding: "9px 6px", margin: "0 -6px", borderRadius: DS.r.sm, borderBottom: i < filtered.length - 1 ? `1px solid ${K.border}` : "none", cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent" }}
              >
                {modoSeleccion && isI && (
                  <span style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${marcada ? K.gold : K.border}`, background: marcada ? K.gold : "transparent", color: "#0A0A0B", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {marcada ? "✓" : ""}
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: K.text, display: "flex", alignItems: "center", gap: 6 }}>
                    {isI ? item.producto || item.tipo : item.referencia}
                    {isI && item.debe === "SI" && <span style={{ fontSize: 9, background: K.red, color: "#fff", borderRadius: 4, padding: "1px 5px", fontWeight: 700, flexShrink: 0 }}>DEBE</span>}
                  </div>
                  <div style={{ fontSize: 11, color: K.muted }}>{isI ? `${item.tipo}${item.cliente ? " · " + item.cliente : ""}` : item.concepto} · {fDate(item.fecha)}</div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: col }}>{isI ? (val >= 0 ? "+" : "") + fmt(val) : "-" + fmt(val)}</div>
                </div>
              </button>
            );
          })}

          {modoSeleccion && seleccion.size > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${K.border}` }}>
              <button onClick={() => aplicarEstado("NO")} style={{ flex: 1, background: `${"#22C55E"}18`, border: `1px solid ${"#22C55E"}44`, color: "#22C55E", borderRadius: DS.r.sm, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                ✓ Marcar pagado ({seleccion.size})
              </button>
              <button onClick={() => aplicarEstado("SI")} style={{ flex: 1, background: `${K.red}18`, border: `1px solid ${K.red}44`, color: K.red, borderRadius: DS.r.sm, padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                ⚠ Marcar pendiente ({seleccion.size})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MesAccordion;
