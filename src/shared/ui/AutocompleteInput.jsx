import { useState } from "react";
import { DS, K } from "../../constants";

/**
 * Input con sugerencias que aparecen mientras el usuario escribe.
 *
 * Props:
 * - label: string|null, etiqueta superior opcional
 * - value: string, valor controlado
 * - onChange: (newValue: string) => void
 * - sugerencias: string[], lista de sugerencias (se filtran por coincidencia)
 * - placeholder: string
 *
 * Comportamiento:
 * - Filtra sugerencias que incluyan el valor actual (case-insensitive)
 * - Hasta 7 sugerencias visibles a la vez
 * - Botón × para limpiar el valor
 * - Click en sugerencia: la selecciona y cierra el dropdown
 */
function AutocompleteInput({
  label,
  value,
  onChange,
  sugerencias = [],
  placeholder,
}) {
  const [abiertas, setAbiertas] = useState(false);

  const filtradas = sugerencias
    .filter(
      (s) =>
        s.toUpperCase().includes((value || "").toUpperCase()) &&
        s.toUpperCase() !== (value || "").toUpperCase()
    )
    .slice(0, 7);

  return (
    <div style={{ marginBottom: 16, minWidth: 0, position: "relative" }}>
      {label && (
        <div
          style={{
            fontSize: 10,
            color: K.mutedLighter,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            fontWeight: 600,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: K.card3,
          border: `1px solid ${value ? K.gold + "66" : K.border}`,
          borderRadius: DS.r.md,
          overflow: "hidden",
          minWidth: 0,
          boxShadow: value ? `0 0 0 3px ${K.gold}14` : "none",
          transition: "border .15s, box-shadow .15s",
        }}
      >
        <input
          value={value || ""}
          onChange={(e) => {
            onChange(e.target.value);
            setAbiertas(true);
          }}
          onFocus={() => setAbiertas(true)}
          onBlur={() => setTimeout(() => setAbiertas(false), 150)}
          placeholder={placeholder || ""}
          autoCapitalize="characters"
          style={{
            flex: 1,
            minWidth: 0,
            width: "100%",
            background: "transparent",
            border: "none",
            color: K.text,
            padding: "14px 14px",
            fontSize: 16,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {value && (
          <button
            onMouseDown={() => onChange("")}
            style={{
              background: "none",
              border: "none",
              color: K.muted,
              padding: "0 12px",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>
      {abiertas && filtradas.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "rgba(22,22,31,.98)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: `1px solid rgba(255,255,255,.08)`,
            borderRadius: `0 0 ${DS.r.md}px ${DS.r.md}px`,
            zIndex: 600,
            overflow: "hidden",
            boxShadow: "0 12px 32px rgba(0,0,0,.7)",
          }}
        >
          {filtradas.map((s, i) => (
            <button
              key={s}
              onMouseDown={() => {
                onChange(s);
                setAbiertas(false);
              }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                borderBottom:
                  i < filtradas.length - 1 ? `1px solid ${K.border}` : "none",
                color: K.text,
                padding: "12px 16px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default AutocompleteInput;