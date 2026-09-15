import { API } from "../../constants";
import { fetchConTimeout, fetchConReintento } from "../http";

/**
 * Servicio de la hoja TAREAS. Usa POST con `Content-Type: text/plain` (no GET
 * con query string como `services/api.js`) porque así lo requiere el
 * Apps Script desplegado para esta hoja — se preserva ese comportamiento.
 *
 * Nombres unificados con el resto de `services/sheets/*.service.js` desde
 * Fase 19 (antes: `obtenerTareas`/`crearTarea`/`actualizarTarea`/`eliminarTarea`).
 *
 * Timeout de 15s en todas las acciones. Reintento automático SOLO en
 * `readAll` (lectura) — reintentar una escritura arriesga duplicarla si el
 * servidor sí la procesó pero la respuesta tardó más que el timeout.
 */
const SHEET = "TAREAS";

export async function readAll() {
  const res = await fetchConReintento(`${API}?action=read&sheet=${SHEET}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

/** `tarea`: { id, texto, completada, prioridad, categoria, fecha, usuario } (shape de creación, minúsculas). */
export async function append(tarea) {
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

/** `tarea`: fila ya leída de Sheets — { ID, Texto, Completada, Prioridad, Categoría, Fecha, Usuario, _row }. */
export async function update(tarea) {
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

export async function remove(rowNum) {
  const res = await fetchConTimeout(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "delete", sheet: SHEET, rowNum }),
  });

  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json;
}
