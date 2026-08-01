import { DS, K } from "../../constants";

/**
 * Input de formulario con etiqueta superior y prefijo opcional.
 *
 * Props:
 * - label: string|null, etiqueta superior opcional
 * - value: string, valor controlado
 * - onChange: (newValue: string) => void
 * - type: 'text' | 'number' | ..., tipo de input (default 'text')
 * - placeholder: string
 * - prefix: string|null, texto opcional a la izquierda del input (ej. '$')
 */
const FInput = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  prefix,
}) => (
  <div style={{ marginBottom: 16, minWidth: 0 }}>
    {label && (
      <div
        style={{
          fontSize: 11,
          color: K.mutedLighter,
          marginBottom: 6,
          fontWeight: 500,
          letterSpacing: 0.3,
          textTransform: "uppercase",
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
        borderRadius: DS.r.md,
        overflow: "hidden",
        minWidth: 0,
        border: `1px solid ${K.border}`,
        transition: "border .15s",
        boxShadow: DS.shadow.sm,
      }}
    >
      {prefix && (
        <span
          style={{
            padding: "0 14px",
            color: K.muted,
            fontSize: 15,
            flexShrink: 0,
            fontWeight: 500,
          }}
        >
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ""}
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
          WebkitAppearance: "none",
        }}
      />
    </div>
  </div>
);

export default FInput;