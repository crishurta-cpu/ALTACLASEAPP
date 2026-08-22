import { useState } from "react";
import { K, DS, fmt, fDate, CCAT } from "../../constants";
import Card from "../../shared/ui/Card";

/**
 * Búsqueda global en tiempo real.
 *
 * Busca en:
 * - Ingresos: producto, cliente, proveedor (case-insensitive).
 * - Gastos: referencia, concepto (case-insensitive).
 *
 * Props:
 * - db: { ingresos: Ingreso[], gastos: Gasto[] }.
 * - onEditIngreso: (item) => void, abre el modal de edición de ingreso.
 * - onEditGasto: (item) => void, abre el modal de edición de gasto.
 *
 * Comportamiento:
 * - Filtra cuando hay 2+ caracteres.
 * - Resultados limitados: 20 ingresos, 10 gastos.
 * - Click en resultado abre el editor correspondiente.
 * - Estado vacío: muestra hint "Escribe al menos 2 caracteres".
 * - Botón "×" en el input limpia la búsqueda.
 *
 * Performance:
 * - Filtrado lineal O(n) sobre ingresos/gastos. Aceptable mientras
 *   el dataset no supere ~1000 items. Si crece, considerar memoización
 *   o índice (Fase 21 — useDeferredValue).
 */
function BusquedaGlobal({ db, onEditIngreso, onEditGasto }) {
  const [q, setQ] = useState("");
  const QU = q.toUpperCase().trim();
  const ingRes =
    QU.length < 2
      ? []
      : db.ingresos
          .filter(
            (i) =>
              (i.producto || "").toUpperCase().includes(QU) ||
              (i.cliente || "").toUpperCase().includes(QU) ||
              (i.proveedor || "").toUpperCase().includes(QU),
          )
          .slice(0, 20);
  const gasRes =
    QU.length < 2
      ? []
      : db.gastos
          .filter((g) => (g.referencia || "").toUpperCase().includes(QU) || (g.concepto || "").toUpperCase().includes(QU))
          .slice(0, 10);
  const total = ingRes.length + gasRes.length;

  return (
    <div style={{ padding: "24px 16px 0" }}>
      <div style={{ fontSize: 10, color: K.gold, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>
        Búsqueda Global
      </div>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cliente, producto, proveedor, concepto..."
          autoFocus
          style={{
            width: "100%",
            background: K.card,
            border: `1.5px solid ${q ? K.gold : K.border}`,
            borderRadius: DS.r.sm,
            color: K.text,
            padding: "13px 40px 13px 16px",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {q && (
          <button
            onClick={() => setQ("")}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: K.muted, fontSize: 18, cursor: "pointer" }}
          >
            ×
          </button>
        )}
      </div>
      {QU.length >= 2 && (
        <div style={{ fontSize: 10, color: K.muted, marginBottom: 10 }}>
          {total === 0 ? "Sin resultados" : `${total} resultado${total !== 1 ? "s" : ""}`}
        </div>
      )}
      {QU.length < 2 && (
        <div style={{ textAlign: "center", color: K.muted, padding: "40px 0", fontSize: 13 }}>
          Escribe al menos 2 caracteres para buscar
        </div>
      )}
      {ingRes.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: K.gold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
            Ingresos ({ingRes.length})
          </div>
          <Card
            ch={
              <>
                {ingRes.map((it, i) => (
                  <button
                    key={it.id}
                    onClick={() => onEditIngreso(it)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: i < ingRes.length - 1 ? 10 : 0,
                      marginBottom: i < ingRes.length - 1 ? 10 : 0,
                      borderBottom: i < ingRes.length - 1 ? `1px solid ${K.border}` : "none",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: K.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.producto}</div>
                      <div style={{ fontSize: 10, color: K.muted }}>
                        {it.cliente} · {it.proveedor} · {fDate(it.fecha)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", marginLeft: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: it.debe === "SI" ? K.red : K.gold }}>+{fmt(it.ganancia)}</div>
                      {it.debe === "SI" && <div style={{ fontSize: 9, color: K.red, fontWeight: 700 }}>DEBE</div>}
                    </div>
                  </button>
                ))}
              </>
            }
          />
        </div>
      )}
      {gasRes.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: K.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
            Gastos ({gasRes.length})
          </div>
          <Card
            ch={
              <>
                {gasRes.map((g, i) => (
                  <button
                    key={g.id}
                    onClick={() => onEditGasto(g)}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: i < gasRes.length - 1 ? 10 : 0,
                      marginBottom: i < gasRes.length - 1 ? 10 : 0,
                      borderBottom: i < gasRes.length - 1 ? `1px solid ${K.border}` : "none",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: K.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.referencia}</div>
                      <div style={{ fontSize: 10, color: K.muted }}>
                        {g.concepto} · {fDate(g.fecha)}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: CCAT[g.concepto] || K.red, marginLeft: 10 }}>-{fmt(g.costo)}</div>
                  </button>
                ))}
              </>
            }
          />
        </div>
      )}
    </div>
  );
}

export default BusquedaGlobal;
