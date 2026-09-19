import { K, DS, fmt } from "../../constants";

/**
 * Card destacada "Total Pendiente por Cobrar" con número de clientes pendientes.
 * Tarjeta clara — misma familia visual que StatsGrid/TopClientes.
 */
function TotalDeudaCard({ totalPorCobrar, cantidadClientes }) {
  return (
    <div style={{
      background: K.light,
      borderRadius: DS.r.lg,
      padding: "14px 8px",
      textAlign: "center",
      boxShadow: "0 8px 20px rgba(0,0,0,.25)",
      marginBottom: 12,
    }}>
      <div style={{ fontSize: 9, color: K.inkMuted, fontWeight: 700, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Total Pendiente por Cobrar
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>
        {fmt(totalPorCobrar)}
      </div>
      <div style={{ fontSize: 11, color: K.inkMuted, fontWeight: 500 }}>
        {cantidadClientes} cliente{cantidadClientes !== 1 ? "s" : ""} pendiente{cantidadClientes !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

export default TotalDeudaCard;
