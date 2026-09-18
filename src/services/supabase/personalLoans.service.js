import { supabase } from "./client";

/**
 * Reemplaza services/sheets/deudaPersonal.service.js (Deuda Valen).
 *
 * Reglas de negocio confirmadas (2026-09-18): un prestamo recibido entra
 * como `other_income` (type='loan', ya excluido de la ganancia en
 * v_monthly_business) y aumenta el saldo; un pago entra como `expenses`
 * (type='personal') y lo reduce. Ambos se linkean a una fila de
 * `personal_loans` via `loan_id` para poder calcular el saldo.
 *
 * La UI actual (DeudaPersonalForm) es un solo libro sin distinguir
 * prestamista, así que se usa una única fila "General" en `personal_loans`
 * por organizacion — el esquema ya soporta varias si en el futuro se separa
 * por prestamista (Valen/Mondragón/Lina en el histórico de Sheets).
 */

const CATEGORY = "PRESTAMO";

async function ensureDefaultLoan(organizationId) {
  const { data: existing, error: findError } = await supabase
    .from("personal_loans")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1);
  if (findError) throw findError;
  if (existing && existing.length > 0) return existing[0].id;

  const { data: created, error: createError } = await supabase
    .from("personal_loans")
    .insert({ organization_id: organizationId, lender_name: "General" })
    .select("id")
    .single();
  if (createError) throw createError;
  return created.id;
}

export async function readAll(organizationId) {
  const [prestamosRes, pagosRes] = await Promise.all([
    supabase
      .from("other_income")
      .select("id, amount, description, income_date")
      .eq("organization_id", organizationId)
      .eq("type", "loan")
      .order("income_date", { ascending: true }),
    supabase
      .from("expenses")
      .select("id, amount, description, expense_date")
      .eq("organization_id", organizationId)
      .eq("type", "personal")
      .eq("category", CATEGORY)
      .order("expense_date", { ascending: true }),
  ]);
  if (prestamosRes.error) throw prestamosRes.error;
  if (pagosRes.error) throw pagosRes.error;

  const movimientos = [
    ...prestamosRes.data.map((r) => ({
      _row: "oi:" + r.id,
      fecha: r.income_date,
      movimiento: r.description || "",
      presto: Number(r.amount) || 0,
      pago: 0,
    })),
    ...pagosRes.data.map((r) => ({
      _row: "exp:" + r.id,
      fecha: r.expense_date,
      movimiento: r.description || "",
      presto: 0,
      pago: Number(r.amount) || 0,
    })),
  ].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  let saldo = 0;
  const conSaldo = movimientos.map((m) => {
    saldo = saldo + m.presto - m.pago;
    return { ...m, saldo };
  });

  return conSaldo.reverse().map((m, i) => ({ id: "dp" + i, ...m }));
}

export async function append(organizationId, item) {
  const loanId = await ensureDefaultLoan(organizationId);
  const presto = Number(item.presto) || 0;
  const pago = Number(item.pago) || 0;

  if (presto > 0) {
    const { error } = await supabase.from("other_income").insert({
      organization_id: organizationId,
      type: "loan",
      amount: presto,
      description: item.movimiento,
      income_date: item.fecha,
      loan_id: loanId,
    });
    if (error) throw error;
  }
  if (pago > 0) {
    const { error } = await supabase.from("expenses").insert({
      organization_id: organizationId,
      type: "personal",
      category: CATEGORY,
      amount: pago,
      description: item.movimiento,
      expense_date: item.fecha,
      loan_id: loanId,
    });
    if (error) throw error;
  }
}

export async function update(organizationId, item) {
  await remove(item._row);
  await append(organizationId, item);
}

export async function remove(rowRef) {
  const [table, id] = String(rowRef).split(":");
  if (table === "oi") {
    const { error } = await supabase.from("other_income").delete().eq("id", id);
    if (error) throw error;
  } else if (table === "exp") {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
  }
}
