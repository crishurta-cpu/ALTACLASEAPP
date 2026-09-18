import { DS, K } from "../../constants";

/**
 * Gráfico circular SVG puro (pie chart) sin librerías externas.
 * Renderiza un pie chart con leyenda de categorías y porcentajes.
 *
 * Props:
 * - datos: [[categoria: string, valor: number]], array de tuplas
 * - colores: string[], paleta de colores por slice (cicla si se agotan)
 * - total: number, suma total (usado para calcular porcentajes)
 *
 * Devuelve `null` si datos está vacío o total es 0.
 */
function GraficoCircular({ datos, colores, total }) {
  if (!datos || datos.length === 0 || total === 0) return null;

  const R = 40;
  const CX = 50;
  const CY = 50;

  // reduce en vez de `let ang` mutado dentro de un .map: evita reasignar una
  // variable "externa" al callback en cada iteración (el ángulo acumulado
  // vive solo dentro de este reduce, no se comparte entre renders).
  const { list: slices } = datos.reduce(
    (acc, [cat, val], i) => {
      const pct = val / total;
      const startAng = acc.ang;
      const endAng = startAng + pct * 2 * Math.PI;
      const x1 = CX + R * Math.cos(startAng);
      const y1 = CY + R * Math.sin(startAng);
      const x2 = CX + R * Math.cos(endAng);
      const y2 = CY + R * Math.sin(endAng);
      const large = pct > 0.5 ? 1 : 0;
      return {
        ang: endAng,
        list: [...acc.list, { cat, val, pct, x1, y1, x2, y2, large, col: colores[i % colores.length] }],
      };
    },
    { ang: -Math.PI / 2, list: [] }
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
        background: K.bg,
        borderRadius: DS.r.md,
        padding: 10,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={80}
        height={80}
        style={{ flexShrink: 0 }}
      >
        {slices.map((s, i) => (
          <path
            key={i}
            d={`M ${CX} ${CY} L ${s.x1.toFixed(2)} ${s.y1.toFixed(2)} A ${R} ${R} 0 ${s.large} 1 ${s.x2.toFixed(2)} ${s.y2.toFixed(2)} Z`}
            fill={s.col}
            stroke={K.bg}
            strokeWidth="1"
          />
        ))}
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        {slices.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: s.col,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: K.grafico,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 80,
                }}
              >
                {s.cat}
              </span>
            </div>
            <span style={{ fontSize: 10, color: K.grafico, flexShrink: 0 }}>
              {(s.pct * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GraficoCircular;