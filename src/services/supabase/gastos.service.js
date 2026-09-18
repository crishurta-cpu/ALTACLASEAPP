import { supabase } from "./client";

/** Reemplaza services/sheets/gastos.service.js — expenses.type='business'. */

export async function readAll(organizationId) {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, category, amount, description, expense_date")
    .eq("organization_id", organizationId)
    .eq("type", "business")
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return data.map((r) => ({
    id: "g" + r.id,
    _row: r.id,
    fecha: r.expense_date,
    concepto: r.category,
    costo: Number(r.amount) || 0,
    referencia: r.description || "",
  }));
}

export async function append(organizationId, item) {
  const { error } = await supabase.from("expenses").insert({
    organization_id: organizationId,
    type: "business",
    category: item.concepto,
    amount: Number(item.costo) || 0,
    description: item.referencia || "",
    expense_date: item.fecha,
  });
  if (error) throw error;
}

export async function update(item) {
  const { error } = await supabase
    .from("expenses")
    .update({
      category: item.concepto,
      amount: Number(item.costo) || 0,
      description: item.referencia || "",
      expense_date: item.fecha,
    })
    .eq("id", item._row);
  if (error) throw error;
}

export async function remove(rowNum) {
  const { error } = await supabase.from("expenses").delete().eq("id", rowNum);
  if (error) throw error;
}
