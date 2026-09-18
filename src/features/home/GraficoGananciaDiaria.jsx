import { K } from "../../constants";
import GraficoPuntos from "../../shared/charts/GraficoPuntos";

/**
 * Wrapper de `GraficoPuntos` con título "Ganancia por día".
 * Solo se renderiza si hay más de 1 día con datos.
 */
function GraficoGananciaDiaria({ diasIng }) {
  if (diasIng.length <= 1) return null;
  return (
    <div style={{ background: K.card, borderRadius: 16, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: K.text, marginBottom: 12 }}>Ganancia por día</div>
      <GraficoPuntos datos={[...diasIng].reverse()} />
    </div>
  );
}

export default GraficoGananciaDiaria;
