import { useState } from "react";
import { K, fmt, fDate } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import InventarioForm from "./InventarioForm";

/**
 * Vista principal del Inventario (compras de mercadería).
 *
 * Props:
 * - db: { inventario: ItemInventario[] } donde ItemInventario es
 *   { id, fecha, producto, proveedor, costo }.
 * - onAdd: async (data) => void, agrega un nuevo item. `data` viene
 *   de InventarioForm con shape { producto, proveedor, costo, fecha }.
 * - onEdit: async (item) => void, edita un item existente (recibe el
 *   item completo con campos actualizados).
 * - onDelete: async (item) => void, elimina un item.
 *
 * Comportamiento:
 * - Lista ordenada por fecha descendente.
 * - Click en un item abre `InventarioForm` en modo edición.
 * - Botón "+ AGREGAR" abre `InventarioForm` en modo creación.
 * - Confirmación de borrado en 2 pasos dentro del modal.
 * - Estado vacío: muestra mensaje "Sin compras registradas".
 */
function Inventario({ db, onAdd, onEdit, onDelete }) {
  const items = [...(db.inventario || [])].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const total = items.reduce((s, i) => s + i.costo, 0);
  const [agregar, setAgregar] = useState(false);
  const [editar, setEditar] = useState(null);

  return (
    <div>
      <Card
        ch={
          <>
            <div style={{ fontSize: 11, color: K.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Total invertido</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: K.purple }}>{fmt(total)}</div>
            <div style={{ fontSize: 11, color: K.muted, marginTop: 2 }}>
              {items.length} compra{items.length !== 1 ? "s" : ""} registradas
            </div>
          </>
        }
      />
      <Btn label="+ AGREGAR AL INVENTARIO" onClick={() => setAgregar(true)} col={K.purple} />
      <div style={{ height: 10 }} />
      {items.length === 0 && (
        <div style={{ textAlign: "center", color: K.muted, padding: 24, fontSize: 13 }}>
          Sin compras registradas en Inventario
        </div>
      )}
      {items.length > 0 && (
        <Card
          ch={
            <>
              <div style={{ fontSize: 11, color: K.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                Toca para editar o borrar
              </div>
              {items.map((it, i, arr) => (
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: K.text }}>{it.producto}</div>
                    <div style={{ fontSize: 10, color: K.muted }}>{it.proveedor} · {fDate(it.fecha)}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: K.purple }}>{fmt(it.costo)}</div>
                </button>
              ))}
            </>
          }
        />
      )}
      {agregar && <InventarioForm onClose={() => setAgregar(false)} onSave={onAdd} />}
      {editar && (
        <InventarioForm
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

export default Inventario;
