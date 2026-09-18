import { useState } from "react";
import { K, DS, TIPOS, fmt } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import ConfirmDelete from "../../shared/ui/ConfirmDelete";
import ChipGroup from "../../shared/ui/ChipGroup";
import FInput from "../../shared/ui/FInput";

/**
 * Modal de edición/eliminación de un ingreso existente.
 *
 * Props:
 * - item: ingreso con shape de negocio (con campos tipo, producto,
 *   cliente, proveedor, costo, precioVenta, debe).
 * - onClose: () => void, cierra el modal sin guardar.
 * - onSave: async (updated) => void, recibe el item modificado
 *   (mismo shape, recalcula ganancia y margen).
 * - onDelete: async (item) => void, elimina la fila en Sheets.
 *
 * Comportamiento:
 * - Recalcula ganancia y margen en tiempo real al editar costo/pv.
 * - Toggle "debe" persiste como "SI" / "NO".
 * - Confirmación de borrado en 2 pasos (botón → ConfirmDelete).
 * - Click en backdrop cierra el modal.
 */
function EditIngreso({ item, onClose, onSave, onDelete }) {
  const [f, setF] = useState({
    tipo: item.tipo,
    producto: item.producto,
    cliente: item.cliente,
    proveedor: item.proveedor,
    costo: String(item.costo),
    pv: String(item.precioVenta),
    debe: item.debe === "SI",
  });
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [err, setErr] = useState(null);

  const up = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const gan = Number(f.pv || 0) - Number(f.costo || 0);
  const mrg = Number(f.pv) > 0 ? Math.round((gan / Number(f.pv)) * 100) : 0;

  const guardar = async () => {
    setSaving(true);
    setErr(null);
    try {
      const updated = {
        ...item,
        tipo: f.tipo,
        producto: f.producto,
        cliente: f.cliente,
        proveedor: f.proveedor,
        costo: Number(f.costo) || 0,
        precioVenta: Number(f.pv) || 0,
        debe: f.debe ? "SI" : "NO",
        ganancia: gan,
        margen: mrg + "%",
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
          <div style={{ fontSize: 17, fontWeight: 700 }}>Editar ingreso</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: K.muted, fontSize: 22, cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <Card
          ch={
            <>
              <ChipGroup label="Tipo" options={TIPOS} value={f.tipo} onChange={up("tipo")} />
              <FInput label="Producto" value={f.producto} onChange={up("producto")} />
              <FInput label="Cliente" value={f.cliente} onChange={up("cliente")} />
              <FInput label="Proveedor" value={f.proveedor} onChange={up("proveedor")} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <FInput label="Costo" value={f.costo} onChange={up("costo")} type="number" prefix="$" />
                <FInput label="Precio venta" value={f.pv} onChange={up("pv")} type="number" prefix="$" />
              </div>
              <div
                style={{
                  background: K.bg,
                  borderRadius: DS.r.sm,
                  padding: "10px 12px",
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  border: `1px solid ${K.border}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 9, color: K.muted }}>GANANCIA</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: gan >= 0 ? K.green : K.red }}>{fmt(gan)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: K.muted }}>MARGEN</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: gan >= 0 ? K.green : K.red }}>{mrg}%</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: K.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>¿El cliente debe?</span>
                <button
                  onClick={() => up("debe")(!f.debe)}
                  style={{
                    background: f.debe ? K.red : "transparent",
                    border: `2px solid ${f.debe ? K.red : K.border}`,
                    color: f.debe ? "#0A0A0A" : K.muted,
                    borderRadius: DS.r.sm,
                    padding: "8px 20px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: 0.5,
                    transition: "all .15s",
                  }}
                >
                  {f.debe ? "SÍ — DEBE ✓" : "NO DEBE"}
                </button>
              </div>
            </>
          }
        />
        {err && <div style={{ textAlign: "center", color: K.red, fontWeight: 700, marginBottom: 8, fontSize: 13 }}>{err}</div>}
        <Btn label="GUARDAR CAMBIOS" onClick={guardar} loading={saving} dis={!f.producto} />
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

export default EditIngreso;
