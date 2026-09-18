import { DS, K } from "../../constants";

/**
 * Contenedor (card) con padding, borde y sombra del design system.
 * `s` permite sobreescribir estilos via prop spread.
 */
const Card = ({ ch, s = {} }) => (
  <div
    style={{
      background: K.card,
      borderRadius: DS.r.lg,
      padding: "18px",
      marginBottom: 12,
      border: `1px solid ${K.border}`,
      boxShadow: DS.shadow.md,
      ...s,
    }}
  >
    {ch}
  </div>
);

export default Card;