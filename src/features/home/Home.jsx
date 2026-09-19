import { useState } from "react";
import { K } from "../../constants";
import Header from "./Header";
import UtilidadCard from "./UtilidadCard";
import StatsGrid from "./StatsGrid";
import ResumenSemanal from "./ResumenSemanal";
import TopClientes from "./TopClientes";
import GraficoGananciaDiaria from "./GraficoGananciaDiaria";
import TotalDeudaCard from "./TotalDeudaCard";
import DebenCobrarAcordeon from "./DebenCobrarAcordeon";
import useHomeStats from "./hooks/useHomeStats";
import useResumenSemanal from "./hooks/useResumenSemanal";
import useTopClientes from "./hooks/useTopClientes";
import useDeudaResumen from "./hooks/useDeudaResumen";
import useUltimosMovimientos from "./hooks/useUltimosMovimientos";

/**
 * Vista principal (Home). Muestra resumen del mes en curso + semana + top clientes + deuda.
 *
 * Props:
 * - `db`: objeto con `ingresos`, `gastos`, `clientesResumen`, `prestamistas`, etc.
 * - `onRefresh`: callback que dispara recarga (botón sync).
 * - `loading`: boolean para deshabilitar sync mientras carga.
 * - `lastSync`: Date|null del último sync.
 *
 * Maneja los estados de los dos acordeones (`debenAbierto`, `gastosAbierto`)
 * con "lift state up" — los pasa a los sub-componentes acordeón por props.
 */
function Home({ db, onRefresh, loading, lastSync }) {
  const [debenAbierto, setDebenAbierto] = useState(false);

  const { ventas, gan, gastos, ahorro, util, mrg } = useHomeStats(db);
  const { ganSem, tendSem, ventasSem, gasSem } = useResumenSemanal(db);
  const { debenList, totalPorCobrar, deudaPorNombre } = useDeudaResumen(db);
  const { top5 } = useTopClientes(db, deudaPorNombre);
  const { diasIng } = useUltimosMovimientos(db);

  return (
    <div style={{ padding: 0 }}>
      <Header onRefresh={onRefresh} loading={loading} lastSync={lastSync} />

      <div style={{ padding: "14px 16px 0" }}>
        <UtilidadCard util={util} mrg={mrg} ahorro={ahorro} />

        <StatsGrid ventas={ventas} gan={gan} gastos={gastos} />

        <ResumenSemanal ganSem={ganSem} ventasSem={ventasSem} gasSem={gasSem} tendSem={tendSem} />

        <div className="ac-desktop-2col">
          <TopClientes top5={top5} deudaPorNombre={deudaPorNombre} />

          <GraficoGananciaDiaria diasIng={diasIng} />

          <TotalDeudaCard totalPorCobrar={totalPorCobrar} cantidadClientes={debenList.length} />

          <DebenCobrarAcordeon
            debenList={debenList}
            abierto={debenAbierto}
            onToggle={() => setDebenAbierto((v) => !v)}
          />
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: K.muted, paddingBottom: 8, marginTop: 4 }}>
          {db.ingresos.length} ingresos · {db.gastos.length} gastos
        </div>
      </div>
    </div>
  );
}

export default Home;
