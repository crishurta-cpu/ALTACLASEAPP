import { useRef, useState } from "react";
import { K, DS } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import FInput from "../../shared/ui/FInput";

/**
 * Modal de edición de datos de un cliente (nombre, documento, teléfono,
 * dirección, ciudad, notas, crédito). `customer` es el registro completo
 * ya traído de Supabase (customers.service.findByName) — no el resumen de
 * `clientesResumen`, que solo trae saldo/deuda.
 *
 * Props:
 * - customer: { id, name, document_number, phone, address, city, notes, credit_enabled }
 * - onClose: () => void
 * - onSave: async ({ name, document_number, phone, address, city, notes, credit_enabled }) => void
 */
function EditClienteForm({ customer, onClose, onSave }) {
  const [f, setF] = useState({
    name: customer.name || "",
    document_number: customer.document_number?.startsWith("SIN-DOC-") ? "" : customer.document_number || "",
    phone: customer.phone || "",
    address: customer.address || "",
    city: customer.city || "",
    notes: customer.notes || "",
    credit_enabled: !!customer.credit_enabled,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const busyRef = useRef(false);

  const up = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const guardar = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSaving(true);
    setErr(null);
    try {
      await onSave(f);
      onClose();
    } catch (e) {
      setErr("Error: " + e.message);
      setSaving(false);
      busyRef.current = false;
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
          <div style={{ fontSize: 17, fontWeight: 700 }}>Editar cliente</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: K.muted, fontSize: 22, cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <Card
          ch={
            <>
              <FInput label="Nombre" value={f.name} onChange={up("name")} placeholder="ej: ALEJANDRA" />
              <FInput label="Documento" value={f.document_number} onChange={up("document_number")} placeholder="opcional" />
              <FInput label="Teléfono" value={f.phone} onChange={up("phone")} placeholder="opcional" />
              <FInput label="Dirección" value={f.address} onChange={up("address")} placeholder="opcional" />
              <FInput label="Ciudad" value={f.city} onChange={up("city")} placeholder="opcional" />
              <FInput label="Notas" value={f.notes} onChange={up("notes")} placeholder="opcional" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 11, color: K.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Cliente con crédito</span>
                <button
                  onClick={() => up("credit_enabled")(!f.credit_enabled)}
                  style={{
                    background: f.credit_enabled ? K.gold : "transparent",
                    border: `2px solid ${f.credit_enabled ? K.gold : K.border}`,
                    color: f.credit_enabled ? "#0A0A0A" : K.muted,
                    borderRadius: DS.r.sm,
                    padding: "8px 20px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {f.credit_enabled ? "SÍ ✓" : "NO"}
                </button>
              </div>
            </>
          }
        />
        {err && (
          <div style={{ textAlign: "center", color: K.red, fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
            {err}
          </div>
        )}
        <Btn label="GUARDAR CAMBIOS" onClick={guardar} loading={saving} dis={!f.name.trim()} />
      </div>
    </div>
  );
}

export default EditClienteForm;
