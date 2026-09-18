import { K } from "../../constants";

/**
 * Grupo de chips seleccionables (single-select).
 *
 * Props:
 * - label: string|null, etiqueta superior opcional
 * - options: string[], opciones a mostrar
 * - value: string, opción actualmente seleccionada
 * - onChange: (newValue: string) => void
 * - colorMap: {[option: string]: string}, mapa opcional de color por opción
 *   (default: K.gold para todas)
 */
const ChipGroup = ({ label, options, value, onChange, colorMap = {} }) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <div
        style={{
          fontSize: 10,
          color: K.muted,
          marginBottom: 7,
          textTransform: "uppercase",
          letterSpacing: 1,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    )}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {options.map((o) => {
        const col = colorMap[o] || K.gold;
        const sel = value === o;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            style={{
              background: sel ? `${col}18` : "transparent",
              border: `1px solid ${sel ? col : K.border}`,
              color: sel ? col : K.muted,
              borderRadius: 20,
              padding: "5px 13px",
              fontSize: 11,
              fontWeight: sel ? 600 : 400,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              transition: "all .15s",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  </div>
);

export default ChipGroup;