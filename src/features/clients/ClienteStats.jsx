import { K, fmt } from "../../constants";
import Card from "../../shared/ui/Card";

/**
 * Tarjetas de resumen para el período seleccionado del cliente.
 */
function ClienteStats({ totalVentas, ganancia }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
      <Card s={{ marginBottom: 0 }} ch={<><div style={{ fontSize: 9, color: K.muted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.8 }}>Total ventas</div><div style={{ fontSize: 18, fontWeight: 700, color: K.gold }}>{fmt(totalVentas)}</div></>} />
      <Card s={{ marginBottom: 0 }} ch={<><div style={{ fontSize: 9, color: K.muted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.8 }}>Ganancia</div><div style={{ fontSize: 18, fontWeight: 700, color: K.green }}>{fmt(ganancia)}</div></>} />
    </div>
  );
}

export default ClienteStats;
