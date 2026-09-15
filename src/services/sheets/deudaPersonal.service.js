import { fetchSheet, appendRow, updateRow, deleteRow } from "../api";
import { parseDeudaPersonal, deudaPersonalToRow } from "../parsers";

const SHEET = "DEUDA VALEN";

export async function readAll() {
  return parseDeudaPersonal(await fetchSheet(SHEET));
}

export async function append(item) {
  return appendRow(SHEET, deudaPersonalToRow(item));
}

/** `item` debe traer `_row` (fila real en Sheets). */
export async function update(item) {
  await updateRow(SHEET, item._row, deudaPersonalToRow(item));
}

export async function remove(rowNum) {
  await deleteRow(SHEET, rowNum);
}
