import { useState } from "react";
import { K, fmt } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import DeudaPersonalForm from "./DeudaPersonalForm";

/**
 * Vista principal del libro personal (Deuda Valen).
 * Separado del negocio a propósito: NO afecta las métricas de negocio.
 *
 * Props:
 * - db: { deudaPersonal: MovimientoDeuda[] } donde MovimientoDeuda es
 *   { id, movimiento, presto, pago, saldo, fecha }.
 * - onAdd: async (data) => void, agrega un movimiento nuevo.
 * - onEdit: async (item) => void, edita un movimiento existente.
 * - onDelete: async (item) => void, elimina un movimiento.
 *
 * Comportamiento:
 * - Saldo actual = saldo del último movimiento registrado (o 0 si no hay).
 * - Lista ordenada por fecha de creación descendente (reverse sin reasignar).
 * - Click en un item abre `DeudaPersonalForm` en modo edición.
 * - Botón "+ AGREGAR" abre `DeudaPersonalForm` en modo creación.
 * - Confirmación de borrado en 2 pasos dentro del modal.
 * - Card de saldo usa color custom (rojo oscuro) para distinguir del negocio.
 */
function Personal({ db, onAdd, onEdit, onDelete }) {
  const items = [...(db.deudaPersonal || [])];
  const saldoActual = items.length > 0 ? items[items.length - 1].saldo : 0;
  const [agregar, setAgregar] = useState(false);
  const [editar, setEditar] = useState(null);

  return (
    <div>
      <Card
        s={{ background: "#1d0909", border: "1px solid #4a1a1a" }}
        ch={
          <>
            <div style={{ fontSize: 11, color: K.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Saldo actual</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: K.red }}>{fmt(saldoActual)}</div>
            <div style={{ fontSize: 11, color: K.muted, marginTop: 2 }}>Libro personal · no afecta las métricas del negocio</div>
          </>
        }
      />
      <Btn label="+ AGREGAR MOVIMIENTO" onClick={() => setAgregar(true)} col={K.red} />
      <div style={{ height: 10 }} />
      {items.length === 0 && (
        <div style={{ textAlign: "center", color: K.muted, padding: 24, fontSize: 13 }}>
          Sin movimientos registrados
        </div>
      )}
      {items.length > 0 && (
        <Card
          ch={
            <>
              <div style={{ fontSize: 11, color: K.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                Toca para editar o borrar
              </div>
              {[...items].reverse().map((it, i, arr) => (
                <button
                  key={it.id}
                  onClick={() => setEditar(it)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: i < arr.length - 1 ? 10 : 0,
                    marginBottom: i < arr.length - 1 ? 10 : 0,
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
      {agregar && <DeudaPersonalForm saldoBase={saldoActual} onClose={() => setAgregar(false)} onSave={onAdd} />}
      {editar && (
        <DeudaPersonalForm
          item={editar}
          onClose={() => setEditar(null)}
          onSave={async (data) => {
            await onEdit({ ...editar, ...data });
          }}
          onDelete={async () => {
            await onDelete(editar);
          }}
        />
      )}
    </div>
  );
}

export default Personal;
