import { useEffect, useState } from "react";
import { tareasService } from "../../../services/sheets";

/**
 * Encapsula estado y acciones de la feature Tareas.
 *
 * Retorna:
 * - tareas: array de tareas cargadas.
 * - texto/setTexto: input controlado de nueva tarea.
 * - cargando: boolean, true durante la carga inicial o recarga.
 * - handleCrear: crea la tarea del input y recarga la lista.
 * - handleEliminar: elimina una tarea por `_row` y recarga la lista.
 */
export function useTareas() {
  const [tareas, setTareas] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);

  async function cargarTareas() {
    try {
      setCargando(true);
      const data = await tareasService.readAll();
      setTareas(data);
    } catch (error) {
      console.error("Error cargando tareas:", error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    // Carga inicial al montar (patrón estándar "fetch on mount"). El lint
    // de react-hooks marca cualquier setState alcanzable desde un efecto,
    // incluso este caso legítimo — no hay estado derivado que "sincronizar",
    // es una carga de datos real (mismo patrón que DataProvider.loadData()).
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      await tareasService.append(nuevaTarea);
      setTexto("");
      cargarTareas();
    } catch (error) {
      console.error("Error creando tarea:", error);
    }
  }

  async function handleEliminar(tarea) {
    try {
      await tareasService.remove(tarea._row);
      cargarTareas();
    } catch (error) {
      console.error("Error eliminando tarea:", error);
    }
  }

  return { tareas, texto, setTexto, cargando, handleCrear, handleEliminar };
}
