import { useState } from "react";
import { K, DS, fmt, mKey, mLabel } from "../../constants";
import AbonoModal from "./AbonoModal";
import MarcarPagadoBtn from "./MarcarPagadoBtn";
import ClienteStats from "./ClienteStats";
import ClienteHistorial from "./ClienteHistorial";
import DeudaFactura from "./DeudaFactura";
import ReporteClienteBtn from "./ReporteClienteBtn";
import EditClienteForm from "./EditClienteForm";
import { useAuth } from "../../app/hooks/useAuth";
import { useData } from "../../app/hooks/useData";
import * as customersService from "../../services/supabase/customers.service";

/**
 * Vista de detalle de un cliente seleccionado.
 */
function ClienteDetail({
  cliente,
  data,
  mesSel,
  setMesSel,
  pagH,
  setPagH,
  abonoAbierto,
  setAbonoAbierto,
  onBack,
  onEditIngreso,
  onMarcarPagado,
  onRegistrarAbono,
}) {
  const { organizationId } = useAuth();
  const { editCliente } = useData();
  const [editando, setEditando] = useState(null); // registro completo del cliente, o null
  const [cargandoEdit, setCargandoEdit] = useState(false);

  const abrirEdicion = async () => {
    setCargandoEdit(true);
    try {
      const registro = await customersService.findByName(organizationId, cliente);
      setEditando(registro);
    } catch (e) {
      console.error("Error cargando cliente:", e);
    } finally {
      setCargandoEdit(false);
    }
  };

  const { ventas } = data || { ventas: [], gan: 0 };
  const meses = [...new Set(ventas.map((v) => mKey(v.fecha)))].sort().reverse();
  const ventasFiltradas = mesSel === "todos" ? ventas : ventas.filter((v) => mKey(v.fecha) === mesSel);
  const tv = ventasFiltradas.reduce((s, v) => s + v.precioVenta, 0);
  const ganF = ventasFiltradas.reduce((s, v) => s + v.ganancia, 0);
  const abonos = data?.abonos || 0;
  const ventasDeudorasAll = ventas.filter((v) => v.debe === "SI");
  const ventaDeudaMasAntigua = [...ventasDeudorasAll].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0];
  const diasDebe = ventaDeudaMasAntigua ? Math.floor((new Date() - new Date(ventaDeudaMasAntigua.fecha)) / (1000 * 60 * 60 * 24)) : null;
  const ventasDeudoras = ventas.filter((v) => v.debe === "SI");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: K.gold, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>← Volver</button>
        <button onClick={abrirEdicion} disabled={cargandoEdit} style={{ background: "none", border: `1px solid ${K.border}`, color: K.muted, fontSize: 12, fontWeight: 600, cursor: cargandoEdit ? "not-allowed" : "pointer", padding: "5px 12px", borderRadius: DS.r.sm }}>
          {cargandoEdit ? "…" : "✏️ Editar cliente"}
        </button>
      </div>
      <div style={{ background: data?.debe ? K.cardGradRed : K.cardGrad, border: `1px solid ${data?.debe ? K.red + "44" : K.border}`, borderRadius: 16, padding: "16px", marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: K.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Cliente</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: K.white, letterSpacing: -0.5, marginBottom: data?.debe ? 8 : 0 }}>{cliente}</div>
        {data?.debe && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, color: K.red, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Deuda actual</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: K.red }}>{fmt(data.saldo)}</div>
            </div>
            {abonos > 0 && (
              <div>
                <div style={{ fontSize: 9, color: K.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Abonado</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: K.green }}>{fmt(abonos)}</div>
              </div>
            )}
            {diasDebe !== null && (
              <div>
                <div style={{ fontSize: 9, color: K.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Tiempo debiendo</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: diasDebe > 30 ? K.red : diasDebe > 14 ? K.orange : K.muted }}>{diasDebe === 0 ? "Hoy" : diasDebe === 1 ? "1 día" : `${diasDebe} días`}</div>
              </div>
            )}
          </div>
        )}
      </div>
      {data?.debe && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <MarcarPagadoBtn cliente={cliente} ventas={ventas} onMarcarPagado={onMarcarPagado} onBack={onBack} />
            <button onClick={() => setAbonoAbierto(true)} style={{ background: `${K.gold}14`, border: `1px solid ${K.gold}44`, borderRadius: DS.r.md, padding: "13px 0", fontSize: 13, fontWeight: 600, color: K.gold, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>+ Abono</button>
          </div>
          {abonoAbierto && <AbonoModal cliente={cliente} abonosActuales={abonos} onClose={() => setAbonoAbierto(false)} onRegistrar={onRegistrarAbono} />}
        </>
      )}
      {meses.length > 1 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ position: "relative" }}>
            <select value={mesSel} onChange={(e) => setMesSel(e.target.value)} style={{ width: "100%", background: K.card3, border: `1px solid ${mesSel !== "todos" ? K.gold : K.border}`, borderRadius: DS.r.md, color: mesSel !== "todos" ? K.gold : K.text, padding: "11px 34px 11px 14px", fontSize: 14, outline: "none", WebkitAppearance: "none", appearance: "none", cursor: "pointer" }}>
              {["todos", ...meses.filter((m) => m !== "todos")].map((m) => <option key={m} value={m} style={{ background: K.card, color: K.text }}>{m === "todos" ? "Todos los períodos" : mLabel(m)}</option>)}
            </select>
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: K.muted, pointerEvents: "none" }}>▾</span>
          </div>
        </div>
      )}
      <ClienteStats totalVentas={tv} ganancia={ganF} />
      <ClienteHistorial ventasFiltradas={ventasFiltradas} pagH={pagH} setPagH={setPagH} onEditIngreso={onEditIngreso} onMarcarPagado={onMarcarPagado} />
      <DeudaFactura cliente={cliente} ventasDeudoras={ventasDeudoras} abonos={abonos} />
      <ReporteClienteBtn cliente={cliente} ventasDeudoras={ventasDeudoras} abonos={abonos} />
      {editando && (
        <EditClienteForm
          customer={editando}
          onClose={() => setEditando(null)}
          onSave={async (datos) => {
            const nombreCambio = datos.name.trim().toUpperCase() !== cliente.toUpperCase();
            await editCliente(editando.id, datos);
            // Si cambio el nombre, `cliente`/`sel` (arriba, en Clientes.jsx)
            // quedan apuntando al nombre viejo — no hay fila que encontrar
            // en el mapa nuevo. Se vuelve a la lista para no dejar la
            // pantalla en blanco.
            if (nombreCambio) onBack();
          }}
        />
      )}
    </div>
  );
}

export default ClienteDetail;
