import { K, getAccentColor } from "../../constants";

/**
 * Gráfico de líneas SVG puro (sin librerías externas).
 * Escala automática desde 0, con guías horizontales y etiquetas
 * de fecha en cada punto.
 *
 * Props:
 * - datos: [{ fecha, total, n }], serie de puntos a graficar
 *          (mínimo 2 puntos para renderizar)
 *
 * Devuelve `null` si hay menos de 2 puntos.
 */
function GraficoPuntos({ datos }) {
  if (!datos || datos.length < 2) return null;

  const W = 300;
  const H = 90;
  const PADY = 14;
  const PADX = 48; // PADX izquierdo para etiquetas de escala

  const vals = datos.map((d) => d.total);

  const max = Math.max(...vals) || 1;

  // Escala legible: redondear al múltiplo bonito más cercano
  const rango = max;
  const mag = Math.pow(10, Math.floor(Math.log10(rango)));
  const step =
    rango <= mag
      ? mag / 5
      : rango <= 2 * mag
      ? mag / 2
      : rango <= 5 * mag
      ? mag
      : 2 * mag;

  const maxEje = Math.ceil(max / step) * step;

  const guias = [0, Math.round(maxEje / 2), maxEje];

  const toY = (v) => PADY + (1 - v / maxEje) * (H - PADY * 2);
  const toX = (i) => PADX + (i / (datos.length - 1)) * (W - PADX - 8);

  const pts = datos.map((d, i) => ({
    x: toX(i),
    y: toY(d.total),
    d,
  }));

  const path =
    "M" + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ");

  const accent = getAccentColor();

  const fmtEje = (n) =>
    n >= 1000000
      ? `${(n / 1000000).toFixed(1)}M`
      : n >= 1000
      ? `${Math.round(n / 1000)}K`
      : String(n);

  const fmtValor = (n) => {
    if (n >= 1000000) {
      return `${(n / 1000000).toFixed(1).replace(".0", "")}M`;
    }
    if (n >= 1000) {
      return `${Math.round(n / 1000)}K`;
    }
    return String(n);
  };

  const MESES = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 22}`}
      width="100%"
      style={{ overflow: "visible", display: "block" }}
    >
      {/* Guías horizontales */}
      {guias.map((g) => {
        const y = toY(g);
        return (
          <g key={g}>
            <line
              x1={PADX}
              y1={y}
              x2={W - 4}
              y2={y}
              stroke={K.border}
              strokeWidth="0.5"
            />
            <text
              x={PADX - 4}
              y={y + 3}
              textAnchor="end"
              fill={K.muted}
              fontSize="8"
            >
              {fmtEje(g)}
            </text>
          </g>
        );
      })}

      {/* Línea */}
      <path
        d={path}
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Área rellena sutil */}
      <path
        d={
          path +
          ` L ${pts[pts.length - 1].x} ${toY(0)} L ${pts[0].x} ${toY(0)} Z`
        }
        fill={accent}
        opacity="0.08"
      />

      {/* Puntos */}
      {pts.map((p, i) => (
        <g key={i}>
          {/* Valor */}
          <text
            x={p.x}
            y={Math.max(9, p.y - 8)}
            textAnchor="middle"
            fill={K.text}
            fontSize="7"
            fontWeight="700"
          >
            {fmtValor(p.d.total)}
          </text>

          {/* Punto */}
          <circle cx={p.x} cy={p.y} r={3} fill={accent} />

          {/* Fecha */}
          <text
            x={p.x}
            y={H + 14}
            textAnchor="middle"
            fill={K.muted}
            fontSize="7"
          >
            {(() => {
              const d = new Date(p.d.fecha);
              return d.getDate() + " " + MESES[d.getMonth()];
            })()}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default GraficoPuntos;