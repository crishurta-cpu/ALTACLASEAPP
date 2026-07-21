import { useState } from "react";

export default function Tareas({ tareas, setTareas }) {
  const [nuevaTarea, setNuevaTarea] = useState("");

  function agregarTarea() {
    if (!nuevaTarea.trim()) return;

    const tarea = {
      id: Date.now(),
      texto: nuevaTarea.trim(),
      completada: false,
      prioridad: "Media",
      categoria: "General",
      creada: new Date().toISOString(),
    };

    setTareas((prev) => [tarea, ...prev]);
    setNuevaTarea("");
  }

  function toggleTarea(id) {
    setTareas((prev) =>
      prev.map((tarea) =>
        tarea.id === id
          ? { ...tarea, completada: !tarea.completada }
          : tarea
      )
    );
  }

  function eliminarTarea(id) {
    setTareas((prev) => prev.filter((tarea) => tarea.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">
          📝 Tareas
        </h2>

        <div className="flex gap-3">
          <input
            type="text"
            value={nuevaTarea}
            onChange={(e) => setNuevaTarea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                agregarTarea();
              }
            }}
            placeholder="Escribe una nueva tarea..."
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          />

          <button
            onClick={agregarTarea}
            className="rounded-xl bg-black px-5 py-3 text-white hover:opacity-90"
          >
            Agregar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        {tareas.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            No hay tareas.
          </div>
        ) : (
          <div className="space-y-3">
            {tareas.map((tarea) => (
              <div
                key={tarea.id}
                className="flex items-center justify-between rounded-xl border p-4 transition hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleTarea(tarea.id)}
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                      tarea.completada
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-400 bg-white hover:border-green-500"
                    }`}
                  >
                    {tarea.completada ? "✓" : ""}
                  </button>

                  <div>
                    <p
                      className={`text-base font-semibold transition ${
                        tarea.completada
                          ? "line-through text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {tarea.texto}
                    </p>

                    <div className="mt-1 flex gap-2 text-sm">
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        📌 {tarea.categoria}
                      </span>

                      <span className="rounded-full bg-orange-100 px-2 py-1">
                        🟠 {tarea.prioridad}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => eliminarTarea(tarea.id)}
                  className="rounded-lg px-3 py-2 text-red-500 transition hover:bg-red-50"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}