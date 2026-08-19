import { useState } from "react";
import { K, DS, CONCS, CCAT } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import ConfirmDelete from "../../shared/ui/ConfirmDelete";
import ChipGroup from "../../shared/ui/ChipGroup";
import FInput from "../../shared/ui/FInput";

/**
 * Modal de edición/eliminación de un gasto existente.
 *
 * Props:
 * - item: gasto con shape de negocio (campos concepto, costo, referencia).
 * - onClose: () => void, cierra el modal sin guardar.
 * - onSave: async (updated) => void, recibe el item modificado
 *   (mismo shape).
 * - onDelete: async (item) => void, elimina la fila en Sheets.
 *
 * Comportamiento:
 * - Click en backdrop cierra el modal.
 * - Confirmación de borrado en 2 pasos (botón → ConfirmDelete).
 * - El input numérico de costo se renderiza inline por consistencia con
 *   GastoForm (prefijo `$` con padding fijo, mismo patrón histórico).
 */
function EditGasto({ item, onClose, onSave, onDelete }) {
  const [f, setF] = useState({ concepto: item.concepto, costo: String(item.costo), ref: item.referencia });
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [err, setErr] = useState(null);

  const up = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const guardar = async () => {
    setSaving(true);
    setErr(null);
    try {
      const updated = {
        ...item,
        concepto: f.concepto,
        costo: Number(f.costo) || 0,
        referencia: f.ref,
      };
      await onSave(updated);
      onClose();
    } catch (e) {
      setErr("Error: " + e.message);
      setSaving(false);
    }
  };

  const borrar = async () => {
    setSaving(true);
    setErr(null);
    try {
      await onDelete(item);
      onClose();
    } catch (e) {
      setErr("Error: " + e.message);
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 1000, display: "flex", alignItems: "flex-end" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: K.bg,
          width: "100%",
          maxWidth: 430,
          margin: "0 auto",
          borderRadius: "20px 20px 0 0",
          padding: "18px 16px",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Editar gasto</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: K.muted, fontSize: 22, cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <Card
          ch={
            <>
              <ChipGroup label="Concepto" options={CONCS} value={f.concepto} onChange={up("concepto")} colorMap={CCAT} />
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: K.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.8 }}>Valor</div>
                <div style={{ display: "flex", alignItems: "center", background: K.card2, border: `1px solid ${K.border}`, borderRadius: DS.r.sm }}>
                  <span style={{ padding: "0 14px", color: K.muted, fontSize: 14 }}>$</span>
                  <input
                    type="number"
                    value={f.costo}
                    onChange={(e) => up("costo")(e.target.value)}
                    style={{ flex: 1, background: "transparent", border: "none", color: K.text, padding: "12px 8px 12px 0", fontSize: 16, outline: "none", fontWeight: 700 }}
                  />
                </div>
              </div>
              <FInput label="Referencia" value={f.ref} onChange={up("ref")} />
            </>
          }
        />
        {err && (
          <div style={{ textAlign: "center", color: K.red, fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
            {err}
          </div>
        )}
        <Btn label="GUARDAR CAMBIOS" onClick={guardar} col={K.red} loading={saving} dis={!f.ref || !f.costo} />
        {!confirmDel ? (
          <button
            onClick={() => setConfirmDel(true)}
            style={{ width: "100%", background: "none", border: "none", color: K.red, fontSize: 13, fontWeight: 700, padding: "12px 0 4px", cursor: "pointer" }}
          >
            🗑️ Borrar este registro
          </button>
        ) : (
          <ConfirmDelete onConfirm={borrar} onCancel={() => setConfirmDel(false)} />
        )}
      </div>
    </div>
  );
}

export default EditGasto;
