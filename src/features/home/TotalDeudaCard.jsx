import { K, DS, fmt } from "../../constants";

/**
 * Card destacada "Total Pendiente por Cobrar" con número de clientes pendientes.
 */
function TotalDeudaCard({ totalPorCobrar, cantidadClientes }) {
  return (
    <div style={{
      background: K.cardGradRed,
      border: `1px solid ${K.red}33`,
      borderRadius: DS.r.lg,
      padding: "14px 8px",
      textAlign: "center",
      boxShadow: DS.shadow.sm,
      marginBottom: 12,
    }}>
      <div style={{ fontSize: 9, color: K.muted, fontWeight: 700, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Total Pendiente por Cobrar
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: K.red, marginBottom: 6 }}>
        {fmt(totalPorCobrar)}
      </div>
      <div style={{ fontSize: 11, color: K.muted, fontWeight: 500 }}>
        {cantidadClientes} cliente{cantidadClientes !== 1 ? "s" : ""} pendiente{cantidadClientes !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

export default TotalDeudaCard;
