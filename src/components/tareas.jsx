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
  <div className="bg-[#1e1e2a] rounded-2xl border border-white/10 shadow-md p-4">

    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-white">
        📋 Tareas
      </h2>

      <span className="text-xs text-gray-400">
        {tareas.length} tarea{tareas.length !== 1 ? "s" : ""}
      </span>
    </div>

    <div className="flex gap-2 mb-5">
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escribe una nueva tarea..."
        className="flex-1 rounded-xl bg-[#2a2a3b] border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:border-blue-500 transition"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCrear();
        }}
      />

      <button
        onClick={handleCrear}
        className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-white font-semibold transition"
      >
        Crear
      </button>
    </div>

    <div className="space-y-2">

      {tareas.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No hay tareas pendientes.
        </div>
      )}

      {tareas.map((tarea) => (

        <div
          key={tarea._row}
          className="flex items-center justify-between rounded-xl bg-[#2a2a3b] border border-white/10 px-4 py-3 hover:border-blue-500 transition"
        >

          <div className="flex items-center gap-3 flex-1">

            <button
              className="w-5 h-5 rounded-full border-2 border-gray-500 hover:border-green-500 transition"
            />

            <span className="text-white break-words">
              {tarea.Texto}
            </span>

          </div>

          <button
            onClick={() => handleEliminar(tarea)}
            className="text-red-400 hover:text-red-500 transition text-lg"
            title="Eliminar tarea"
          >
            🗑️
          </button>

        </div>

      ))}

    </div>

  </div>
);
}