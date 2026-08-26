import { fmt } from "../../constants";

/**
 * Card destacada "Total Pendiente por Cobrar" con número de clientes pendientes.
 * Usa colores hardcodeados (gris/rojo) para distinguir visualmente del resto del Home.
 */
function TotalDeudaCard({ totalPorCobrar, cantidadClientes }) {
  return (
    <div style={{
      background: "rgb(30, 30, 42)",
      borderRadius: 16,
      padding: "14px 8px",
      textAlign: "center",
      border: "1px solid rgba(255, 255, 255, 0.07)",
      boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.4)",
      marginBottom: 12,
    }}>
      <div style={{ fontSize: 9, color: "rgb(107, 114, 128)", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Total Pendiente por Cobrar
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "rgb(239, 68, 68)", marginBottom: 6 }}>
        {fmt(totalPorCobrar)}
      </div>
      <div style={{ fontSize: 11, color: "rgb(107, 114, 128)", fontWeight: 500 }}>
        {cantidadClientes} cliente{cantidadClientes !== 1 ? "s" : ""} pendiente{cantidadClientes !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

export default TotalDeudaCard;
