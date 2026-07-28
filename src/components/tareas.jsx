import { useEffect, useState } from "react";
import {
  obtenerTareas,
  crearTarea,
  eliminarTarea,
} from "../services/tareasServices.js";

export default function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);

  async function cargarTareas() {
    try {
      setCargando(true);

      const data = await obtenerTareas();

      setTareas(data);

    } catch (error) {
      console.error("Error cargando tareas:", error);
    } finally {
      setCargando(false);
    }
  }


  useEffect(() => {
    cargarTareas();
  }, []);


  async function handleCrear() {
    if (!texto.trim()) return;

    const nuevaTarea = {
      id: crypto.randomUUID(),
      texto,
      completada: false,
      prioridad: "Media",
      categoria: "General",
      fecha: new Date().toISOString(),
      usuario: "admin",
    };


    try {
      await crearTarea(nuevaTarea);

      setTexto("");

      cargarTareas();

    } catch (error) {
      console.error("Error creando tarea:", error);
    }
  }


  async function handleEliminar(tarea) {
    try {
      await eliminarTarea(tarea._row);

      cargarTareas();

    } catch (error) {
      console.error("Error eliminando tarea:", error);
    }
  }


  if (cargando) {
  return (
    <div
      style={{
        width: "100%",
        background: "#1e1e2a",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 18,
        padding: 40,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#d1d5db",
        fontWeight: 600,
      }}
    >
      Cargando tareas...
    </div>
  );
}


return (
  <div
    style={{
      width: "100%",
      background: "#1e1e2a",
      border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 18,
      padding: 18,
      boxSizing: "border-box",
    }}
  >
    {/* Encabezado */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div
          style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          📋 Tareas
        </div>

        <div
          style={{
            color: "#8b93a7",
            fontSize: 13,
            marginTop: 3,
          }}
        >
          {tareas.length} tarea{tareas.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>

    {/* Crear tarea */}
    <div
      style={{
        display: "flex",
        gap: 10,
        marginBottom: 20,
        flexWrap: "wrap",
      }}
    >
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
          background: "#2b2d3f",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 12,
          padding: "13px 15px",
          color: "#fff",
          outline: "none",
          fontSize: 15,
        }}
      />

      <button
        onClick={handleCrear}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "13px 24px",
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        + Agregar
      </button>
    </div>

    {/* Sin tareas */}
    {tareas.length === 0 && (
      <div
        style={{
          background: "#262839",
          border: "1px dashed rgba(255,255,255,.08)",
          borderRadius: 14,
          padding: 35,
          textAlign: "center",
          color: "#8b93a7",
        }}
      >
        No hay tareas pendientes.
      </div>
    )}

    {/* Lista */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {tareas.map((tarea) => (
        <div
          key={tarea._row}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 15,
            background: "#2b2d3f",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 14,
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flex: 1,
              minWidth: 0,
            }}
            >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "linear-gradient(145deg,#34374b,#252736)",
                border: "2px solid rgba(255,255,255,.12)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#22c55e",
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                cursor: "pointer",
                transition: ".25s",
              }}
            >
              ✓
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                {tarea.Texto}
              </span>

              <span
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#8b93a7",
                }}
              >
                Pendiente
              </span>
            </div>
          </div>

          <button
            onClick={() => handleEliminar(tarea)}
            title="Eliminar"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: "none",
              background: "rgba(239,68,68,.12)",
              color: "#ef4444",
              fontSize: 18,
              cursor: "pointer",
              transition: ".25s",
              flexShrink: 0,
            }}
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  </div>
);
}