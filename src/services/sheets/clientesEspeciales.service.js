import { fetchSheet } from "../api";
import { parseClientesEspeciales } from "../parsers";

const SHEET = "CLIENTES ESPECIALES";

/** Hoja de solo lectura: nada en la app escribe en CLIENTES ESPECIALES hoy. */
export async function readAll() {
  return parseClientesEspeciales(await fetchSheet(SHEET));
}
