import { fetchSheet } from "../api";
import { parseClientesResumen } from "../parsers";
import { API } from "../../constants";
import { fetchConTimeout } from "../http";

const SHEET = "CLIENTES";

/**
 * CLIENTES es una hoja de fórmulas (UNIQUE/FILTER) en Sheets: no tiene
 * append/update/remove propios. Su único escritor es `registrarAbono`
 * (columna F, buscando por nombre) — `marcarPagado` escribe en INGRESOS,
 * no acá (ver ingresos.service.js).
 */
export async function readAll() {
  return parseClientesResumen(await fetchSheet(SHEET));
}

/**
 * Registra un abono en la columna F de CLIENTES, buscando por nombre (no
 * por `_row`: las filas se reordenan solas con las fórmulas de la hoja).
 * `montoNuevo` es el TOTAL acumulado de abonos, no el incremento.
 * Es un `updateCell` puntual — no encaja en el patrón genérico de arriba,
 * así que no pasa por `callApi`. Tiene timeout pero no reintento (escritura).
 */
export async function registrarAbono(cliente, montoNuevo) {
  const qs = new URLSearchParams({
    action: "updateCell",
    sheet: SHEET,
    lookupValue: cliente,
    col: "F",
    value: String(montoNuevo),
  }).toString();
  const res = await fetchConTimeout(`${API}?${qs}`, { method: "GET", redirect: "follow" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Error al registrar abono");
}
