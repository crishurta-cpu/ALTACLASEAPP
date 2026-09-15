import { API } from "../../constants";
import { fetchConTimeout, fetchConReintento } from "../http";

/**
 * Servicio de la hoja TAREAS. Usa POST con `Content-Type: text/plain` (no GET
 * con query string como `services/api.js`) porque así lo requiere el
 * Apps Script desplegado para esta hoja — se preserva ese comportamiento.
 * Unificación completa con `services/api.js` queda para Fase 19.
 *
 * Timeout de 15s en todas las acciones. Reintento automático SOLO en
 * `obtenerTareas` (lectura) — reintentar una escritura arriesga duplicarla
 * si el servidor sí la procesó pero la respuesta tardó más que el timeout.
 */
const SHEET = "TAREAS";

export async function obtenerTareas() {
  const res = await fetchConReintento(`${API}?action=read&sheet=${SHEET}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export async function crearTarea(tarea) {
  const row = [
    tarea.id,
    tarea.texto,
    tarea.completada,
    tarea.prioridad,
    tarea.categoria,
    tarea.fecha,
    tarea.usuario,
  ];

  const res = await fetchConTimeout(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "append", sheet: SHEET, row: JSON.stringify(row) }),
  });

  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json;
}

export async function actualizarTarea(tarea) {
  const row = [
    tarea.ID,
    tarea.Texto,
    tarea.Completada,
    tarea.Prioridad,
    tarea.Categoría,
    tarea.Fecha,
    tarea.Usuario,
  ];

  const res = await fetchConTimeout(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "update", sheet: SHEET, rowNum: tarea._row, row: JSON.stringify(row) }),
  });

  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json;
}

export async function eliminarTarea(row) {
  const res = await fetchConTimeout(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "delete", sheet: SHEET, rowNum: row }),
  });

  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json;
}
