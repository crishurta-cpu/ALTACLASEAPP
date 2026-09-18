import { K, DS } from "../../constants";
import Card from "../../shared/ui/Card";

/**
 * Panel superior con clientes que tienen deuda activa.
 */
function DebenCobrarPanel({ lista, onSelect }) {
  const deudores = lista.filter(([, v]) => v.debe);
  if (deudores.length === 0) return null;

  return (
    <Card
      s={{ background: "#1a0808", border: `1px solid #4a1a1a`, marginBottom: 10 }}
      ch={
        <>
          <div style={{ fontSize: 11, color: K.red, fontWeight: 700, marginBottom: 6 }}>⚠️ DEBEN COBRAR</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {deudores.map(([n]) => (
              <button key={n} onClick={() => onSelect(n)} style={{ background: `${K.red}18`, border: `1px solid ${K.red}`, color: K.red, borderRadius: DS.r.sm, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>{n}</button>
            ))}
          </div>
        </>
      }
    />
  );
}

export default DebenCobrarPanel;
