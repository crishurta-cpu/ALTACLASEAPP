import { useState } from "react";
import { K, DS, fmt } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import FInput from "../../shared/ui/FInput";
import AutocompleteInput from "../../shared/ui/AutocompleteInput";

/**
 * Registro rápido de múltiples ventas en una sola entrada.
 * Cada fila = un producto vendido a un cliente por un proveedor.
 *
 * Props:
 * - onSave: async (item) => void, recibe el item con shape de negocio —
 *   igual que `IngresoForm` desde Fase 19 (la conversión a fila Sheets
 *   vive en `ingresos.service.js`, no acá).
 * - clientes: string[] con nombres para autocompletar el campo Cliente de
 *   cada fila (Fase 22 — antes reservado sin usar, mismo patrón que `IngresoForm`).
 *
 * Comportamiento:
 * - Filtra filas válidas (producto + cliente + precio) antes de guardar.
 * - Cada fila válida se guarda secuencialmente con await onSave.
 * - Calcula ganancia y margen por fila (precio - costo).
 * - Muestra ganancia total del lote.
 * - Al guardar: limpia y deja 1 fila vacía con id incrementado.
 */
function IngresoBloqueForm({ onSave, clientes = [] }) {
  const [filas, setFilas] = useState([
    { id: 1, producto: "", cliente: "", proveedor: "", costo: "", precio: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(null);

  const nextId = Math.max(...filas.map((f) => f.id || 0)) + 1;

  const updateFila = (id, k, v) => {
    setFilas((f) => f.map((f) => (f.id === id ? { ...f, [k]: v } : f)));
  };
  const addFila = () =>
    setFilas((f) => [
      ...f,
      { id: nextId, producto: "", cliente: "", proveedor: "", costo: "", precio: "" },
    ]);
  const removeFila = (id) => setFilas((f) => f.filter((f) => f.id !== id));

  const guardar = async () => {
    const validas = filas.filter((f) => f.producto && f.cliente && f.precio);
    if (validas.length === 0) {
      setErr("Agrega al menos una venta completa");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      for (const f of validas) {
        const costo = Number(f.costo) || 0;
        const pv = Number(f.precio) || 0;
        const gan = pv - costo;
        const mrg = pv > 0 ? ((gan / pv) * 100).toFixed(1) : 0;
        const trim = (s) => String(s || "").toUpperCase().trim();
        const item = {
          fecha: new Date().toISOString(),
          tipo: "VENTA",
          producto: trim(f.producto),
          cliente: trim(f.cliente),
          proveedor: trim(f.proveedor),
          costo,
          precioVenta: pv,
          debe: "NO",
          ganancia: gan,
          margen: mrg + "%",
        };
        await onSave(item);
      }
      setFilas([
        { id: nextId + 1, producto: "", cliente: "", proveedor: "", costo: "", precio: "" },
      ]);
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } catch (e) {
      setErr("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const total = filas.reduce((s, f) => {
    const p = Number(f.precio) || 0;
    const c = Number(f.costo) || 0;
    return s + (p - c);
  }, 0);

  return (
    <div>
      {ok && <div style={{ textAlign: "center", color: K.gold, fontWeight: 700, marginBottom: 12, fontSize: 14 }}>✓ Lote guardado en Google Sheets!</div>}
      {err && <div style={{ color: K.red, fontSize: 13, marginBottom: 12 }}>{err}</div>}

      <div style={{ background: K.card2, borderRadius: DS.r.lg, overflow: "hidden", marginBottom: 12 }}>
        {filas.map((f, i) => (
          <div key={f.id} style={{ borderBottom: i < filas.length - 1 ? `0.5px solid ${K.border}` : "none", padding: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <FInput value={f.producto} onChange={(v) => updateFila(f.id, "producto", v)} placeholder="Producto" />
              <AutocompleteInput value={f.cliente} onChange={(v) => updateFila(f.id, "cliente", v)} placeholder="Cliente" sugerencias={clientes} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <FInput value={f.proveedor} onChange={(v) => updateFila(f.id, "proveedor", v)} placeholder="Proveedor" />
              <FInput type="number" value={f.costo} onChange={(v) => updateFila(f.id, "costo", v)} placeholder="Costo" prefix="$" />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <FInput type="number" value={f.precio} onChange={(v) => updateFila(f.id, "precio", v)} placeholder="Precio venta" prefix="$" />
              </div>
              <button
                onClick={() => removeFila(f.id)}
                style={{ background: "transparent", border: "none", color: K.red, fontSize: 18, cursor: "pointer", padding: "0 8px", WebkitTapHighlightColor: "transparent" }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addFila}
        style={{
          width: "100%",
          background: "transparent",
          border: `1.5px dashed ${K.gold}`,
          borderRadius: DS.r.sm,
          padding: 10,
          fontSize: 13,
          fontWeight: 600,
          color: K.gold,
          cursor: "pointer",
          marginBottom: 12,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        + Agregar otra venta
      </button>

      {total !== 0 && (
        <Card
          ch={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: K.muted }}>Ganancia total del lote</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: total > 0 ? K.green : K.red }}>
                {total > 0 ? "+" : ""}
                {fmt(total)}
              </span>
            </div>
          }
        />
      )}

      <Btn
        label={`GUARDAR LOTE (${filas.filter((f) => f.producto && f.cliente && f.precio).length} ventas)`}
        onClick={guardar}
        loading={saving}
        dis={filas.length === 0}
      />
    </div>
  );
}

export default IngresoBloqueForm;
