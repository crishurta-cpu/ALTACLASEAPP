import { fetchSheet, appendRow, updateRow, deleteRow } from "../api";
import { parseInventario, inventarioToRow } from "../parsers";

const SHEET = "INVENTARIO";

export async function readAll() {
  return parseInventario(await fetchSheet(SHEET));
}

export async function append(item) {
  return appendRow(SHEET, inventarioToRow(item));
}

/** `item` debe traer `_row` (fila real en Sheets). */
export async function update(item) {
  await updateRow(SHEET, item._row, inventarioToRow(item));
}

export async function remove(rowNum) {
  await deleteRow(SHEET, rowNum);
}
