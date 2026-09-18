import { useState } from "react";
import { K } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import ConfirmDelete from "../../shared/ui/ConfirmDelete";
import FInput from "../../shared/ui/FInput";

/**
 * Modal compartido para agregar/editar un item de Inventario.
 *
 * Props:
 * - item (opcional): si se pasa, el modal entra en modo edición
 *   y se muestra el botón de borrar. Si se omite, es modo creación.
 * - onClose: () => void, cierra el modal sin guardar.
 * - onSave: async (data) => void, persiste los cambios. `data` tiene
 *   shape { producto, proveedor, costo, fecha }.
 * - onDelete (opcional): async () => void, elimina el item. Solo
 *   se muestra si `item` está presente.
 *
 * Comportamiento:
 * - Click en backdrop cierra el modal.
 * - Confirmación de borrado en 2 pasos (botón → ConfirmDelete).
 * - En modo creación, la fecha se autogenera con `new Date().toISOString()`.
 * - En modo edición, la fecha del item se preserva.
 * - A diferencia de Ingreso/Gasto, Inventario NO normaliza texto
 *   con toUpperCase().trim() al guardar (decisión histórica, preservar).
 */
function InventarioForm({ item, onClose, onSave, onDelete }) {
  const [f, setF] = useState({
    producto: item?.producto || "",
    proveedor: item?.proveedor || "",
    costo: String(item?.costo || ""),
  });
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [err, setErr] = useState(null);

  const up = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const guardar = async () => {
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        producto: f.producto,
        proveedor: f.proveedor,
        costo: Number(f.costo) || 0,
        fecha: item?.fecha || new Date().toISOString(),
      });
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
      await onDelete();
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
          <div style={{ fontSize: 17, fontWeight: 700 }}>{item ? "Editar inventario" : "Agregar al inventario"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: K.muted, fontSize: 22, cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <Card
          ch={
            <>
              <FInput label="Producto" value={f.producto} onChange={up("producto")} placeholder="ej: NIKE TN" />
              <FInput label="Proveedor" value={f.proveedor} onChange={up("proveedor")} placeholder="ej: LIDER, BOA..." />
              <FInput label="Costo" value={f.costo} onChange={up("costo")} type="number" prefix="$" />
            </>
          }
        />
        {err && (
          <div style={{ textAlign: "center", color: K.red, fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
            {err}
          </div>
        )}
        <Btn label={item ? "GUARDAR CAMBIOS" : "AGREGAR"} onClick={guardar} col={K.purple} loading={saving} dis={!f.producto || !f.costo} />
        {item && onDelete && (!confirmDel ? (
          <button
            onClick={() => setConfirmDel(true)}
            style={{ width: "100%", background: "none", border: "none", color: K.red, fontSize: 13, fontWeight: 700, padding: "12px 0 4px", cursor: "pointer" }}
          >
            🗑️ Borrar este registro
          </button>
        ) : (
          <ConfirmDelete onConfirm={borrar} onCancel={() => setConfirmDel(false)} />
        ))}
      </div>
    </div>
  );
}

export default InventarioForm;
