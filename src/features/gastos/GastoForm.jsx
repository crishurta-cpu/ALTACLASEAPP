import { useState } from "react";
import { K, DS, CONCS, CCAT } from "../../constants";
import { gastoToRow } from "../../services/parsers";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import ChipGroup from "../../shared/ui/ChipGroup";
import FInput from "../../shared/ui/FInput";

/**
 * Formulario de registro de un nuevo gasto.
 *
 * Props:
 * - onSave: async (row) => void, recibe la fila ya en formato Sheets
 *   (orden de columnas garantizado por gastoToRow).
 *
 * Comportamiento:
 * - Construye el item con shape de negocio, lo transforma con gastoToRow
 *   y delega la persistencia al padre.
 * - Normaliza texto con toUpperCase().trim() al guardar (campo referencia).
 * - Conserva el `concepto` seleccionado tras un guardado exitoso
 *   (típico en gastos: registras varios del mismo rubro).
 * - El input numérico de costo se renderiza inline (no se abstrae a FInput)
 *   para permitir el prefijo `$` con padding consistente al patrón histórico.
 */
function GastoForm({ onSave }) {
  const [f, setF] = useState({ concepto: "NEGOCIO", costo: "", ref: "" });
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(null);

  const up = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const go = async () => {
    setSaving(true);
    setErr(null);
    try {
      const item = {
        fecha: new Date().toISOString(),
        concepto: f.concepto,
        costo: Number(f.costo) || 0,
        referencia: String(f.ref || "").toUpperCase().trim(),
      };
      await onSave(gastoToRow(item));
      setF({ concepto: f.concepto, costo: "", ref: "" });
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
        <span style={{ fontSize: 26 }}>⬇️</span>
        <div>
          <div style={{ fontSize: 10, color: K.muted }}>NUEVO · SE GUARDA EN SHEETS</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: K.red }}>Gasto</div>
        </div>
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
                  placeholder="0"
                  style={{ flex: 1, background: "transparent", border: "none", color: K.text, padding: "12px 8px 12px 0", fontSize: 16, outline: "none", fontWeight: 700 }}
                />
              </div>
            </div>
            <FInput label="Referencia" value={f.ref} onChange={up("ref")} placeholder="ej: ARRIENDO, MERCADO..." />
          </>
        }
      />
      {ok && (
        <div style={{ textAlign: "center", color: K.gold, fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
          ✓ Guardado en Google Sheets!
        </div>
      )}
      {err && (
        <div style={{ textAlign: "center", color: K.red, fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
          {err}
        </div>
      )}
      <Btn label="REGISTRAR GASTO" onClick={go} col={K.red} dis={!f.costo || !f.ref} loading={saving} />
    </div>
  );
}

export default GastoForm;
