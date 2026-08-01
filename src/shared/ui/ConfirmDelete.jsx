import { DS, K } from "../../constants";

/**
 * Doble botón inline de confirmación para acciones destructivas (borrar).
 * Reemplaza al window.confirm() que no anda bien en artefactos/pwa.
 */
const ConfirmDelete = ({ onConfirm, onCancel }) => (
  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
    <button
      onClick={onConfirm}
      style={{
        flex: 1,
        background: `${K.red}18`,
        border: `1.5px solid ${K.red}`,
        color: K.red,
        borderRadius: DS.r.sm,
        padding: "8px 0",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        letterSpacing: 0.3,
      }}
    >
      Sí, borrar
    </button>
    <button
      onClick={onCancel}
      style={{
        flex: 1,
        background: "transparent",
        border: `1.5px solid ${K.border}`,
        color: K.muted,
        borderRadius: DS.r.sm,
        padding: "8px 0",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Cancelar
    </button>
  </div>
);

export default ConfirmDelete;