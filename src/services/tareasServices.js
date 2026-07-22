const API =
  "https://script.google.com/macros/s/AKfycbySGO0LtHtnT7SBEHF22TfsDUmz3kqmz3C2a-tZk6zL3_ZFuEoUF485h4QWvxq4H_S7/exec";

const SHEET = "TAREAS";

export async function obtenerTareas() {
  const res = await fetch(
    `${API}?action=read&sheet=${SHEET}`
  );

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

  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "append",
      sheet: SHEET,
      row,
    }),
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

  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "update",
      sheet: SHEET,
      rowNum: tarea._row,
      row: JSON.stringify(row),
    }),
  });

  return await res.json();
}

export async function eliminarTarea(row) {
  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      sheet: SHEET,
      rowNum: row,
    }),
  });

  return await res.json();
}