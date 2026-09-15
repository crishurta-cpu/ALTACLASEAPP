import { ACCENTS, K } from "../../constants";
import { useAccentColor } from "../../app/hooks/useAccentColor";

/**
 * Selector de color de acento (8 opciones).
 * Persiste en localStorage vía `useAccentColor` y dispara evento "accentchange"
 * para que otros componentes que usen ese hook reaccionen sin recargar la página.
 *
 * Props: ninguno.
 */
function AccentPicker() {
  const [accentId, , setAccent] = useAccentColor();
  const cambiarAccent = setAccent;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {ACCENTS.map((a) => (
        <button
          key={a.id}
          onClick={() => cambiarAccent(a.id)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            padding: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: a.color,
              border:
                accentId === a.id
                  ? `3px solid ${K.white}`
                  : "3px solid transparent",
              boxSizing: "border-box",
              transition: "border .15s",
            }}
          />
          <span
            style={{
              fontSize: 9,
              color: accentId === a.id ? K.text : K.muted,
              fontWeight: accentId === a.id ? 600 : 400,
            }}
          >
            {a.label}
          </span>
        </button>
      ))}
    </div>
  );
}

export default AccentPicker;