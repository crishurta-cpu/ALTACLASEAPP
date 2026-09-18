import { fetchSheet, appendRow, updateRow, deleteRow } from "../api";
import { parseIngresos, ingresoToRow } from "../parsers";

const SHEET = "INGRESOS";

export async function readAll() {
  return parseIngresos(await fetchSheet(SHEET));
}

/** `item` con shape de negocio (fecha, tipo, producto, cliente, ...); la conversión a fila vive acá. */
export async function append(item) {
  return appendRow(SHEET, ingresoToRow(item)); // retorna el número de fila real recién creada
}

/** `item` debe traer `_row` (fila real en Sheets). */
export async function update(item) {
  await updateRow(SHEET, item._row, ingresoToRow(item));
}

export async function remove(rowNum) {
  await deleteRow(SHEET, rowNum);
}
