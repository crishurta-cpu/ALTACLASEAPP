import { useEffect, useState } from "react";
import * as tasksService from "../../../services/supabase/tasks.service";
import { useAuth } from "../../../app/hooks/useAuth";

/**
 * Encapsula estado y acciones de la feature Tareas, contra la tabla
 * `tasks` de Supabase (Fase M5, cutover — reemplaza la hoja TAREAS).
 * Shape expuesto a la UI sin cambios: `{ _row, Texto }` por tarea.
 */
export function useTareas() {
  const { organizationId } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(true);

  async function cargarTareas() {
    if (!organizationId) return;
    try {
      setCargando(true);
      const data = await tasksService.readAll(organizationId);
      setTareas(data.map((t) => ({ _row: t.id, Texto: t.title })));
    } catch (error) {
      console.error("Error cargando tareas:", error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de datos real, no estado derivado
    cargarTareas();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cargarTareas no esta memoizada a proposito
  }, [organizationId]);

  async function handleCrear() {
    if (!texto.trim() || !organizationId) return;
    try {
      await tasksService.append(organizationId, texto.trim());
      setTexto("");
      cargarTareas();
    } catch (error) {
      console.error("Error creando tarea:", error);
    }
  }

  async function handleEliminar(tarea) {
    try {
      await tasksService.remove(tarea._row);
      cargarTareas();
    } catch (error) {
      console.error("Error eliminando tarea:", error);
    }
  }

  return { tareas, texto, setTexto, cargando, handleCrear, handleEliminar };
}
