import { useState } from "react";
import { K, DS } from "../../constants";
import ClientesListItem from "./ClientesListItem";
import DebenCobrarPanel from "./DebenCobrarPanel";
import ClienteDetail from "./ClienteDetail";
import useClientesFilter from "./hooks/useClientesFilter";

/**
 * Orquestador de la feature Clientes.
 */
function Clientes({ db, onEditIngreso, onMarcarPagado, onRegistrarAbono }) {
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");
  const [letraFiltro, setLetraFiltro] = useState(null);
  const [mesSel, setMesSel] = useState("todos");
  const [pagH, setPagH] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [abonoAbierto, setAbonoAbierto] = useState(false);
  const { map, letrasDisponibles, lista, listaPagina, totalPaginas, paginaSegura } = useClientesFilter(db, q, letraFiltro, pagina);

  if (sel) {
    return (
      <ClienteDetail
        cliente={sel}
        data={map[sel] || { ventas: [], gan: 0 }}
        mesSel={mesSel}
        setMesSel={setMesSel}
        pagH={pagH}
        setPagH={setPagH}
        abonoAbierto={abonoAbierto}
        setAbonoAbierto={setAbonoAbierto}
        onBack={() => {
          setSel(null);
          setMesSel("todos");
        }}
        onEditIngreso={onEditIngreso}
        onMarcarPagado={onMarcarPagado}
        onRegistrarAbono={onRegistrarAbono}
      />
    );
  }

  return (
    <div>
      <DebenCobrarPanel lista={lista} onSelect={setSel} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: K.muted }}>{lista.length} clientes</div>
      </div>
      <input value={q} onChange={(e) => { setQ(e.target.value); setPagina(1); setLetraFiltro(null); }} placeholder="🔍 Buscar..." style={{ width: "100%", background: K.card, border: `1px solid ${K.border}`, boxShadow: DS.shadow.sm, borderRadius: DS.r.md, color: K.text, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 10 }}>
        <button onClick={() => { setLetraFiltro(null); setPagina(1); }} style={{ background: !letraFiltro ? K.gold : "transparent", border: `1px solid ${!letraFiltro ? K.gold : K.border}`, color: !letraFiltro ? "#000" : K.muted, borderRadius: 5, padding: "2px 6px", fontSize: 10, fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>Todos</button>
        {letrasDisponibles.map((l) => (
          <button key={l} onClick={() => { setLetraFiltro(l === letraFiltro ? null : l); setPagina(1); }} style={{ background: letraFiltro === l ? K.gold : "transparent", border: `1px solid ${letraFiltro === l ? K.gold : K.border}`, color: letraFiltro === l ? "#000" : K.muted, borderRadius: 5, padding: "2px 6px", fontSize: 10, fontWeight: 600, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>{l}</button>
        ))}
      </div>
      {listaPagina.map(([nom, st]) => (
        <ClientesListItem key={nom} nom={nom} st={st} onSelect={setSel} />
      ))}
      {totalPaginas > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 8, marginBottom: 8 }}>
          <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaSegura === 1} style={{ background: "none", border: `1px solid ${K.border}`, color: paginaSegura === 1 ? K.muted : K.text, borderRadius: DS.r.sm, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: paginaSegura === 1 ? "not-allowed" : "pointer", opacity: paginaSegura === 1 ? 0.4 : 1 }}>← Atrás</button>
          <span style={{ fontSize: 11, color: K.muted }}>{paginaSegura}/{totalPaginas}</span>
          <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaSegura === totalPaginas} style={{ background: "none", border: `1px solid ${K.border}`, color: paginaSegura === totalPaginas ? K.muted : K.text, borderRadius: DS.r.sm, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: paginaSegura === totalPaginas ? "not-allowed" : "pointer", opacity: paginaSegura === totalPaginas ? 0.4 : 1 }}>Siguiente →</button>
        </div>
      )}
    </div>
  );
}

export default Clientes;
