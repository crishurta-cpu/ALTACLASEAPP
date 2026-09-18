/**
 * Etiqueta pequeña (chip) con fondo translúcido del color recibido.
 * Usado para badges de tipo, estado, etc.
 */
const Pill = ({ text, color }) => (
  <span
    style={{
      background: `${color}18`,
      color,
      borderRadius: 4,
      padding: "2px 8px",
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    }}
  >
    {text}
  </span>
);

export default Pill;