import { useRef, useState } from "react";
import { K, DS, fmt } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import ConfirmDelete from "../../shared/ui/ConfirmDelete";
import FInput from "../../shared/ui/FInput";

/**
 * Modal compartido para agregar/editar un movimiento de Deuda Valen.
 *
 * Props:
 * - item (opcional): si se pasa, el modal entra en modo edición
 *   y se muestra el botón de borrar. Si se omite, es modo creación.
 * - saldoBase (opcional, default 0): saldo actual del libro al crear un
 *   movimiento nuevo. En modo edición, el saldo base se recalcula
 *   internamente a partir del item.
 * - onClose: () => void, cierra el modal sin guardar.
 * - onSave: async (data) => void, persiste los cambios. `data` tiene
 *   shape { movimiento, presto, pago, saldo, fecha }.
 * - onDelete (opcional): async () => void, elimina el movimiento.
 *   Solo se muestra si `item` está presente.
 *
 * Comportamiento:
 * - El saldo se recalcula automáticamente: `base + presto - pago`.
 * - `base` se calcula como:
 *   - Modo edición: `item.saldo - item.presto + item.pago` (saldo previo).
 *   - Modo creación: `saldoBase` (último saldo registrado).
 * - Muestra el nuevo saldo en tiempo real antes de guardar.
 * - Click en backdrop cierra el modal.
 * - Confirmación de borrado en 2 pasos (botón → ConfirmDelete).
 * - Fecha por defecto: `new Date().toISOString()` — las columnas de fecha en
 *   Supabase son `timestamptz`, no aceptan el formato D/M/YYYY de
 *   `toLocaleDateString("es-CO")` (bug real: Postgres lo rechaza siempre que
 *   el día es > 12, y en días ≤12 lo malinterpreta día/mes sin avisar).
 */
function DeudaPersonalForm({ item, saldoBase = 0, onClose, onSave, onDelete }) {
  const base = item ? item.saldo - (item.presto || 0) + (item.pago || 0) : saldoBase;
  const [f, setF] = useState({
    movimiento: item?.movimiento || "",
    presto: String(item?.presto || ""),
    pago: String(item?.pago || ""),
    fecha: item?.fecha || "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [err, setErr] = useState(null);
  const busyRef = useRef(false); // guard sincrono compartido guardar/borrar, ver IngresoForm

  const up = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const nuevoSaldo = base + (Number(f.presto) || 0) - (Number(f.pago) || 0);

  const guardar = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        movimiento: f.movimiento,
        presto: Number(f.presto) || 0,
        pago: Number(f.pago) || 0,
        saldo: nuevoSaldo,
        fecha: f.fecha || new Date().toISOString(),
      });
      onClose();
    } catch (e) {
      setErr("Error: " + e.message);
      setSaving(false);
      busyRef.current = false;
    }
  };

  const borrar = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSaving(true);
    setErr(null);
    try {
      await onDelete();
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
          <div style={{ fontSize: 17, fontWeight: 700 }}>{item ? "Editar movimiento" : "Agregar movimiento"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: K.muted, fontSize: 22, cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <Card
          ch={
            <>
              <FInput label="Descripción" value={f.movimiento} onChange={up("movimiento")} placeholder="ej: Cadena, Mercado..." />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <FInput label="Presto (suma deuda)" value={f.presto} onChange={up("presto")} type="number" prefix="$" />
                <FInput label="Pago (resta deuda)" value={f.pago} onChange={up("pago")} type="number" prefix="$" />
              </div>
              <div style={{ background: K.bg, borderRadius: DS.r.sm, padding: "10px 12px", marginTop: 4, marginBottom: 12, border: `1px solid ${K.border}` }}>
                <div style={{ fontSize: 9, color: K.muted }}>NUEVO SALDO</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: K.red }}>{fmt(nuevoSaldo)}</div>
              </div>
            </>
          }
        />
        {err && (
          <div style={{ textAlign: "center", color: K.red, fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
            {err}
          </div>
        )}
        <Btn label={item ? "GUARDAR CAMBIOS" : "AGREGAR"} onClick={guardar} col={K.red} loading={saving} dis={!f.movimiento} />
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

export default DeudaPersonalForm;
