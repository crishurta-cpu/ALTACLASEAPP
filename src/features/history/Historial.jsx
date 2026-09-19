import { useState } from "react";
import { K, curM } from "../../constants";
import MesAccordion from "./MesAccordion";
import useHistorialFilter from "./hooks/useHistorialFilter";

/**
 * Historial anual de ingresos y gastos.
 */
function Historial({ db, onEditIngreso, onEditGasto, onMarcarPagado }) {
  const [open, setOpen] = useState(curM());
  const [filter, setFilter] = useState("ingresos");
  const [buscar, setBuscar] = useState("");
  const [categFiltro, setCategFiltro] = useState(null);
  const [orden, setOrden] = useState("fecha");
  const { months } = useHistorialFilter(db, open, filter, buscar, categFiltro, orden);

  return (
    <div style={{ padding: "24px 16px 0" }}>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: K.text }}>Historial Anual</div>
      <div style={{ fontSize: 13, color: K.muted, marginTop: 2, marginBottom: 16 }}>2026</div>
      {months.map((m) => (
        <MesAccordion
          key={m}
          db={db}
          month={m}
          isOpen={open === m}
          onToggle={() => setOpen(open === m ? null : m)}
          filter={filter}
          setFilter={setFilter}
          buscar={buscar}
          setBuscar={setBuscar}
          categFiltro={categFiltro}
          setCategFiltro={setCategFiltro}
          orden={orden}
          setOrden={setOrden}
          onEditIngreso={onEditIngreso}
          onEditGasto={onEditGasto}
          onMarcarPagado={onMarcarPagado}
        />
      ))}
    </div>
  );
}

export default Historial;
