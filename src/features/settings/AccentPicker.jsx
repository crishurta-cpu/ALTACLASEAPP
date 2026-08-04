import { useState } from "react";
import { ACCENT_KEY, ACCENTS, K } from "../../constants";

/**
 * Selector de color de acento (8 opciones).
 * Persiste en localStorage y dispara evento "accentchange" para
 * que otros componentes reaccionen sin recargar la página.
 *
 * Props: ninguno (lee/escribe directo a localStorage).
 */
function AccentPicker() {
  const [accentId, setAccentId] = useState(
    () => localStorage.getItem(ACCENT_KEY) || "gold"
  );

  const cambiarAccent = (id) => {
    setAccentId(id);
    localStorage.setItem(ACCENT_KEY, id);
    // Forzar re-render sin recargar página completa
    window.dispatchEvent(new Event("accentchange"));
  };

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