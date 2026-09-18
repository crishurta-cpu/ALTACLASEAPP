import { API } from "../constants";
import { fetchConTimeout, fetchConReintento } from "./http";

// GET con todo en query string + row en base64. Esto evita problemas de
// longitud de URL y de caracteres especiales (tildes, comas) en nombres
// largos de cliente/producto/proveedor.
//
// Timeout de 15s en TODAS las acciones (ver ./http.js). Reintento automático
// SOLO en lecturas (action:"read"): reintentar una escritura (append/update/
// delete) es peligroso si el servidor sí procesó la primera petición pero la
// respuesta tardó más que el timeout — duplicaría la operación.
export async function callApi(params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API}?${qs}`;
  const options = { method: "GET", redirect: "follow" };
  const res = params.action === "read"
    ? await fetchConReintento(url, options)
    : await fetchConTimeout(url, options);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Error de script");
  return json;
}

export async function fetchSheet(sheetName) {
  const json = await callApi({ action: "read", sheet: sheetName });
  return json.data;
}

// Codificamos el row en base64 antes de mandarlo: así nombres con tildes, comas o
// textos largos (cliente, producto, proveedor) no rompen la query string del GET.
export const b64 = (str) => {
  if (typeof window !== "undefined" && window.btoa) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  // Node.js fallback (for testing in Vitest)
  return Buffer.from(unescape(encodeURIComponent(str)), "binary").toString("base64");
};

export async function appendRow(sheetName, row) {
  const json = await callApi({ action: "append", sheet: sheetName, rowB64: b64(JSON.stringify(row)) });
  return json.row; // número de fila real recién creada
}

export async function updateRow(sheetName, rowNum, row) {
  await callApi({ action: "update", sheet: sheetName, rowNum: String(rowNum), rowB64: b64(JSON.stringify(row)) });
}

export async function deleteRow(sheetName, rowNum) {
  await callApi({ action: "delete", sheet: sheetName, rowNum: String(rowNum) });
}
