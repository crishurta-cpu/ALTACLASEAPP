import { useState } from "react";
import { K, fmt } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import FInput from "../../shared/ui/FInput";
import DeudaPersonalForm from "./DeudaPersonalForm";
import { useData } from "../../app/hooks/useData";
import * as personalLoansService from "../../services/supabase/personalLoans.service";

/**
 * Libro personal, separado por prestamista (Fase 2026-09-19). Antes todos
 * los movimientos de todos los prestamistas se mezclaban en un solo saldo
 * corrido — el "saldo actual" mostrado terminaba siendo el de la primera
 * transacción registrada, no el total real (bug real reportado). Ahora:
 *
 * - Nivel 1 (`prestamistas`): tarjetas colapsadas, una por prestamista,
 *   con su saldo ya correcto (viene de `v_personal_loan_balances`).
 * - Nivel 2 (`prestamistaSel`, derivado en vivo de `prestamistas` por
 *   `loanIdSel`): al entrar a una, se piden sus movimientos bajo demanda
 *   (no van en el `db` global, igual que `ClienteDetail` trae el registro
 *   completo de un cliente solo cuando se abre) — se guarda solo el id,
 *   nunca una copia del resumen, así el saldo mostrado siempre viene fresco
 *   de `prestamistas` sin necesitar un efecto que los mantenga sincronizados.
 */
function Personal({ prestamistas = [], onAdd, onEdit, onDelete }) {
  const { findOrCreatePrestamista, reloadDeuda } = useData();
  const [loanIdSel, setLoanIdSel] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);
  const [agregar, setAgregar] = useState(false);
  const [editar, setEditar] = useState(null);
  const [nuevoPrestamista, setNuevoPrestamista] = useState(null); // string|null: nombre en edición

  const prestamistaSel = prestamistas.find((p) => p.loanId === loanIdSel) || null;

  const cargarMovimientos = async (loanId) => {
    setCargando(true);
    setErrorCarga(null);
    try {
      setMovimientos(await personalLoansService.readMovimientos(loanId));
    } catch (e) {
      setErrorCarga(e.message);
    } finally {
      setCargando(false);
    }
  };

  const abrirPrestamista = (loanId) => {
    setLoanIdSel(loanId);
    cargarMovimientos(loanId);
  };

  const crearPrestamista = async () => {
    const nombre = (nuevoPrestamista || "").trim();
    if (!nombre) return;
    const loanId = await findOrCreatePrestamista(nombre);
    await reloadDeuda();
    setNuevoPrestamista(null);
    abrirPrestamista(loanId);
  };

  // ── Vista de un prestamista: sus movimientos + saldo correcto ──
  if (prestamistaSel) {
    return (
      <div>
        <button onClick={() => setLoanIdSel(null)} style={{ background: "none", border: "none", color: K.gold, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 14 }}>← Todos los prestamistas</button>
        <Card
          s={{ background: "#1d0909", border: "1px solid #4a1a1a" }}
          ch={
            <>
              <div style={{ fontSize: 11, color: K.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{prestamistaSel.lenderName}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: K.red }}>{fmt(prestamistaSel.saldo)}</div>
              <div style={{ fontSize: 11, color: K.muted, marginTop: 2 }}>Saldo actual · no afecta las métricas del negocio</div>
            </>
          }
        />
        <Btn label="+ AGREGAR MOVIMIENTO" onClick={() => setAgregar(true)} col={K.red} />
        <div style={{ height: 10 }} />
        {cargando && <div style={{ textAlign: "center", color: K.muted, padding: 24, fontSize: 13 }}>Cargando...</div>}
        {!cargando && errorCarga && (
          <div style={{ textAlign: "center", color: K.red, padding: 24, fontSize: 13 }}>Error cargando movimientos: {errorCarga}</div>
        )}
        {!cargando && !errorCarga && movimientos.length === 0 && (
          <div style={{ textAlign: "center", color: K.muted, padding: 24, fontSize: 13 }}>Sin movimientos registrados</div>
        )}
        {!cargando && !errorCarga && movimientos.length > 0 && (
          <Card
            ch={
              <>
                <div style={{ fontSize: 11, color: K.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  Toca para editar o borrar
                </div>
                {movimientos.map((it, i, arr) => (
                  <button
                    key={it.id}
                    onClick={() => setEditar(it)}
                    style={{
                      width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      paddingBottom: i < arr.length - 1 ? 10 : 0, marginBottom: i < arr.length - 1 ? 10 : 0,
                      borderBottom: i < arr.length - 1 ? `1px solid ${K.border}` : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: K.text }}>{it.movimiento}</div>
                      <div style={{ fontSize: 10, color: K.muted }}>{it.fecha || "—"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {it.pago > 0 && <div style={{ fontSize: 13, fontWeight: 700, color: K.green }}>-{fmt(it.pago)}</div>}
                      {it.presto > 0 && <div style={{ fontSize: 13, fontWeight: 700, color: K.red }}>+{fmt(it.presto)}</div>}
                      <div style={{ fontSize: 10, color: K.muted }}>saldo {fmt(it.saldo)}</div>
                    </div>
                  </button>
                ))}
              </>
            }
          />
        )}
        {agregar && (
          <DeudaPersonalForm
            saldoBase={movimientos[0]?.saldo || 0}
            onClose={() => setAgregar(false)}
            onSave={async (data) => {
              await onAdd(prestamistaSel.loanId, data);
              await cargarMovimientos(prestamistaSel.loanId);
            }}
          />
        )}
        {editar && (
          <DeudaPersonalForm
            item={editar}
            onClose={() => setEditar(null)}
            onSave={async (data) => {
              await onEdit(prestamistaSel.loanId, { ...editar, ...data });
              await cargarMovimientos(prestamistaSel.loanId);
            }}
            onDelete={async () => {
              await onDelete(editar);
              await cargarMovimientos(prestamistaSel.loanId);
            }}
          />
        )}
      </div>
    );
  }

  // ── Vista de lista: un prestamista por tarjeta, colapsado ──
  return (
    <div>
      <div style={{ fontSize: 11, color: K.muted, marginBottom: 12 }}>Libro personal · no afecta las métricas del negocio</div>
      {prestamistas.length === 0 && !nuevoPrestamista && (
        <div style={{ textAlign: "center", color: K.muted, padding: 24, fontSize: 13 }}>Sin prestamistas registrados</div>
      )}
      {prestamistas.map((p) => (
        <button
          key={p.loanId}
          onClick={() => abrirPrestamista(p.loanId)}
          style={{ width: "100%", background: "#1d0909", border: "1px solid #4a1a1a", borderRadius: 16, padding: "14px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent" }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: K.text }}>{p.lenderName}</div>
            <div style={{ fontSize: 11, color: K.muted, marginTop: 2 }}>Prestado {fmt(p.totalPrestado)} · Pagado {fmt(p.totalPagado)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: K.red }}>{fmt(p.saldo)}</div>
            <div style={{ fontSize: 10, color: K.muted }}>saldo</div>
          </div>
        </button>
      ))}

      {nuevoPrestamista === null ? (
        <Btn label="+ NUEVO PRESTAMISTA" onClick={() => setNuevoPrestamista("")} col={K.red} outline />
      ) : (
        <Card
          s={{ marginTop: 8 }}
          ch={
            <>
              <FInput label="Nombre del prestamista" value={nuevoPrestamista} onChange={setNuevoPrestamista} placeholder="ej: Camila Ríos" />
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}><Btn label="Cancelar" onClick={() => setNuevoPrestamista(null)} outline /></div>
                <div style={{ flex: 1 }}><Btn label="Crear" onClick={crearPrestamista} col={K.red} dis={!nuevoPrestamista.trim()} /></div>
              </div>
            </>
          }
        />
      )}
    </div>
  );
}

export default Personal;
