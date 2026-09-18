import { memo } from "react";
import { K, DS, fmt } from "../../constants";

const MEDALS = ["#C9A84C", "#A8A8A8", "#8B6914", "#38383A", "#38383A"];

/**
 * Fila horizontal scrollable con el top 5 de clientes del mes por ganancia.
 * Muestra ⚠️ si el cliente debe más de $1.000.000 (lookup en `deudaPorNombre`).
 *
 * Props:
 * - `top5`: array de tuplas [nombre, { g: number, n: number }]
 * - `deudaPorNombre`: mapa { [nombreUpperTrim]: saldo } para detectar deuda alta
 *
 * Envuelto en `React.memo` (Fase 21): sin callbacks, ambas props vienen de
 * `useTopClientes`/`useDeudaResumen` (`useMemo`), así que se saltan
 * re-renders cuando `Home` cambia por estado no relacionado (ej. abrir el
 * acordeón de "Deben cobrar").
 */
function TopClientes({ top5, deudaPorNombre }) {
  if (top5.length === 0) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: K.text, marginBottom: 10 }}>Top Clientes del Mes</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
        {top5.map(([nombre, stats], i) => {
          const debeMucho = (deudaPorNombre[nombre] || 0) > 1000000;
          return (
            <div key={nombre} style={{ flexShrink: 0, scrollSnapAlign: "start", width: 88, background: K.card, borderRadius: DS.r.lg, padding: 10, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 88 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: MEDALS[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: i < 3 ? "#000" : K.muted }}>{i + 1}</div>
                {debeMucho && <span style={{ fontSize: 11 }}>⚠️</span>}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: K.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{nombre}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? K.gold : K.green }}>{fmt(stats.g)}</div>
                <div style={{ fontSize: 9, color: K.muted }}>{stats.n} vta{stats.n !== 1 ? "s" : ""}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(TopClientes);
