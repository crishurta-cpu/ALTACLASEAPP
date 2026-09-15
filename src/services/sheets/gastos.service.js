import { fetchSheet, appendRow, updateRow, deleteRow } from "../api";
import { parseGastos, gastoToRow } from "../parsers";

const SHEET = "GASTOS";

export async function readAll() {
  return parseGastos(await fetchSheet(SHEET));
}

/** `item` con shape de negocio (fecha, concepto, costo, referencia). */
export async function append(item) {
  return appendRow(SHEET, gastoToRow(item));
}

/** `item` debe traer `_row` (fila real en Sheets). */
export async function update(item) {
  await updateRow(SHEET, item._row, gastoToRow(item));
}

export async function remove(rowNum) {
  await deleteRow(SHEET, rowNum);
}
