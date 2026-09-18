import { K } from "../../constants";

/**
 * Línea horizontal de 1px usando el color border del design system.
 * Usado para separar secciones dentro de cards.
 */
const Divider = () => (
  <div style={{ height: 1, background: K.border, margin: "10px 0" }} />
);

export default Divider;