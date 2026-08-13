import { useState } from "react";
import { K, DS, TIPOS, fmt } from "../../constants";
import { ingresoToRow } from "../../services/parsers";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import ChipGroup from "../../shared/ui/ChipGroup";
import FInput from "../../shared/ui/FInput";
import AutocompleteInput from "../../shared/ui/AutocompleteInput";

/**
 * Formulario de registro de un nuevo ingreso (venta individual).
 *
 * Props:
 * - onSave: async (row) => void, recibe la fila ya en formato Sheets
 *   (orden de columnas garantizado por ingresoToRow).
 * - clientes: string[] con nombres de clientes para autocompletar.
 * - proveedores: string[] con nombres de proveedores para autocompletar.
 *
 * Comportamiento:
 * - Construye el item con shape de negocio, lo transforma con ingresoToRow
 *   y delega la persistencia al padre.
 * - Normaliza texto con toUpperCase().trim() al guardar.
 * - Muestra ganancia y margen en tiempo real.
 * - Toggle "debe" persiste como "SI" / "NO" en Sheets.
 */
function IngresoForm({ onSave, clientes = [], proveedores = [] }) {
  const [f, setF] = useState({
    tipo: "VENTA",
    producto: "",
    cliente: "",
    proveedor: "",
    costo: "",
    pv: "",
    debe: false,
  });
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(null);

  const up = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const gan = Number(f.pv || 0) - Number(f.costo || 0);
  const mrg = Number(f.pv) > 0 ? Math.round((gan / Number(f.pv)) * 100) : 0;

  const go = async () => {
    setSaving(true);
    setErr(null);
    try {
      const trim = (s) => String(s || "").toUpperCase().trim();
      const item = {
        fecha: new Date().toISOString(),
        tipo: f.tipo,
        producto: trim(f.producto),
        cliente: trim(f.cliente),
        proveedor: trim(f.proveedor),
        costo: Number(f.costo) || 0,
        precioVenta: Number(f.pv) || 0,
        debe: f.debe ? "SI" : "NO",
        ganancia: gan,
        margen: mrg + "%",
      };
      await onSave(ingresoToRow(item));
      setF({ tipo: "VENTA", producto: "", cliente: "", proveedor: "", costo: "", pv: "", debe: false });
      setOk(true);
      setTimeout(() => setOk(false), 3000);
    } catch (e) {
      setErr("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span style={{ fontSize: 26 }}>⬆️</span>
        <div>
          <div style={{ fontSize: 10, color: K.muted }}>NUEVO · SE GUARDA EN SHEETS</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: K.gold }}>Ingreso</div>
        </div>
      </div>
      <Card
        ch={
          <>
            <ChipGroup label="Tipo" options={TIPOS} value={f.tipo} onChange={up("tipo")} />
            <FInput label="Producto" value={f.producto} onChange={up("producto")} placeholder="ej: NIKE TN, SAMBA..." />
            <AutocompleteInput label="Cliente" value={f.cliente} onChange={up("cliente")} placeholder="ej: ALEJANDRA" sugerencias={clientes} />
            <AutocompleteInput label="Proveedor" value={f.proveedor} onChange={up("proveedor")} placeholder="ej: LIDER, MENORES, FYM..." sugerencias={proveedores} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <FInput label="Costo" value={f.costo} onChange={up("costo")} type="number" prefix="$" placeholder="0" />
              <FInput label="Precio venta" value={f.pv} onChange={up("pv")} type="number" prefix="$" placeholder="0" />
            </div>
            {(f.costo || f.pv) && (
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
                  <div style={{ fontSize: 9, color: K.muted, marginBottom: 1 }}>GANANCIA</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: gan >= 0 ? K.green : K.red }}>{fmt(gan)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: K.muted, marginBottom: 1 }}>MARGEN</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: gan >= 0 ? K.green : K.red }}>{mrg}%</div>
                </div>
              </div>
            )}
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
      {ok && <div style={{ textAlign: "center", color: K.gold, fontWeight: 700, marginBottom: 8, fontSize: 14 }}>✓ Guardado en Google Sheets!</div>}
      {err && <div style={{ textAlign: "center", color: K.red, fontWeight: 700, marginBottom: 8, fontSize: 13 }}>{err}</div>}
      <Btn label="REGISTRAR INGRESO" onClick={go} dis={!f.producto || !f.pv} loading={saving} />
    </div>
  );
}

export default IngresoForm;
