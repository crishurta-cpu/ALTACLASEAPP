import { DS, K } from "../../constants";

/**
 * Botón primario con estados: normal, deshabilitado, cargando, outline.
 *
 * Props:
 * - label: texto a mostrar (cuando loading=true se reemplaza por "Guardando...")
 * - onClick: handler
 * - col: color de acento (default K.gold)
 * - dis: boolean, deshabilita
 * - outline: boolean, variante con borde en lugar de fill
 * - sm: boolean, versión compacta (padding y font-size reducidos)
 * - loading: boolean, muestra estado de carga
 */
const Btn = ({ label, onClick, col = K.gold, dis, outline, sm, loading }) => (
  <button
    onClick={onClick}
    disabled={dis || loading}
    style={{
      width: sm ? "auto" : "100%",
      padding: sm ? "10px 20px" : "15px",
      background: outline ? "transparent" : dis || loading ? K.card3 : col,
      color: outline ? col : dis || loading ? K.muted : "#000000",
      border: outline ? `1.5px solid ${col}` : "none",
      borderRadius: sm ? DS.r.sm : DS.r.md,
      fontSize: sm ? 13 : 15,
      fontWeight: 600,
      cursor: dis || loading ? "not-allowed" : "pointer",
      opacity: (dis || loading) ? 0.35 : 1,
      letterSpacing: -0.1,
      WebkitTapHighlightColor: "transparent",
      boxShadow: dis || loading || outline ? "none" : DS.shadow.glow(col),
      transition: "opacity .15s, box-shadow .15s, transform .1s",
    }}
  >
    {loading ? "Guardando..." : label}
  </button>
);

export default Btn;