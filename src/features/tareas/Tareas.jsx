import { K, DS } from "../../constants";
import Card from "../../shared/ui/Card";
import Btn from "../../shared/ui/Btn";
import { useTareas } from "./hooks/useTareas";

/**
 * Lista simple de tareas (pendientes, sin completar) respaldada en la hoja
 * TAREAS. Crear agrega al final; eliminar borra directo (sin confirmación
 * en 2 pasos, a diferencia de Ingresos/Gastos/Inventario).
 */
export default function Tareas() {
  const { tareas, texto, setTexto, cargando, handleCrear, handleEliminar } = useTareas();

  if (cargando) {
    return (
      <Card
        s={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}
        ch={<span style={{ color: K.mutedLighter, fontWeight: 600 }}>Cargando tareas...</span>}
      />
    );
  }

  return (
    <Card
      ch={
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: K.text, fontSize: 22, fontWeight: 700 }}>📋 Tareas</div>
              <div style={{ color: K.muted, fontSize: 13, marginTop: 3 }}>
                {tareas.length} tarea{tareas.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe una nueva tarea..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCrear();
              }}
              style={{
                flex: "1 1 300px",
                minWidth: 0,
                background: K.card3,
                border: `1px solid ${K.border}`,
                borderRadius: DS.r.md,
                padding: "13px 15px",
                color: K.text,
                outline: "none",
                fontSize: 15,
              }}
            />
            <Btn label="+ Agregar" onClick={handleCrear} sm />
          </div>

          {tareas.length === 0 && (
            <div style={{ background: K.card2, border: `1px dashed ${K.border}`, borderRadius: DS.r.lg, padding: 35, textAlign: "center", color: K.muted }}>
              No hay tareas pendientes.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tareas.map((tarea) => (
              <div
                key={tarea._row}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 15,
                  background: K.card3,
                  border: `1px solid ${K.border}`,
                  borderRadius: DS.r.lg,
                  padding: "14px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: `linear-gradient(145deg, ${K.card4}, ${K.card2})`,
                      border: `2px solid ${K.borderStrong}`,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: K.green,
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                    <span style={{ color: K.text, fontSize: 15, fontWeight: 600, lineHeight: 1.4, wordBreak: "break-word" }}>
                      {tarea.Texto}
                    </span>
                    <span style={{ marginTop: 4, fontSize: 11, color: K.muted }}>Pendiente</span>
                  </div>
                </div>

                <button
                  onClick={() => handleEliminar(tarea)}
                  title="Eliminar"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: DS.r.sm,
                    border: "none",
                    background: `${K.red}1f`,
                    color: K.red,
                    fontSize: 18,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </>
      }
    />
  );
}
