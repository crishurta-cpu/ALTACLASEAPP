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
    return <p>Cargando tareas...</p>;
  }


  return (
    <div>
      <h1>Tareas</h1>

      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Nueva tarea"
      />

      <button onClick={handleCrear}>
        Crear
      </button>


      <ul>
        {tareas.map((tarea) => (
          <li key={tarea._row}>
            {tarea.Texto}

            <button
              onClick={() => handleEliminar(tarea)}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

    </div>
  );
}