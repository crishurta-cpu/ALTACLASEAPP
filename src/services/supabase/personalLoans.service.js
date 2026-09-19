import { supabase } from "./client";

/**
 * Libro personal (antes "Deuda Valen"), ahora separado por prestamista.
 *
 * Un prestamo recibido entra como `other_income` (type='loan', ya excluido
 * de la ganancia en v_monthly_business) y aumenta el saldo; un pago entra
 * como `expenses` (type='personal') y lo reduce. Ambos se linkean a una
 * fila de `personal_loans` via `loan_id` — esa fila YA existe separada por
 * prestamista en produccion (Valentina Arango, Carlos Mondragón, Lina
 * Cañizales), la UI anterior simplemente ignoraba esa separación y mezclaba
 * todos los movimientos de todos los prestamistas en un solo saldo corrido
 * (bug real: el saldo mostrado era el de la transacción más antigua, no el
 * total — ver Personal.jsx `saldoActual` antes de este fix).
 */
const CATEGORY = "PRESTAMO";

/** Resumen por prestamista, usando la vista que ya calcula saldo=prestado-pagado. */
export async function readLenders(organizationId) {
  const { data, error } = await supabase
    .from("v_personal_loan_balances")
    .select("loan_id, lender_name, total_borrowed, total_paid, balance")
    .eq("organization_id", organizationId)
    .order("lender_name", { ascending: true });
  if (error) throw error;
  return data.map((r) => ({
    loanId: r.loan_id,
    lenderName: r.lender_name,
    totalPrestado: Number(r.total_borrowed) || 0,
    totalPagado: Number(r.total_paid) || 0,
    saldo: Number(r.balance) || 0,
  }));
}

export async function findOrCreateLender(organizationId, lenderName) {
  const cleanName = String(lenderName || "").trim();
  if (!cleanName) throw new Error("Falta el nombre del prestamista");

  const { data: existing, error: findError } = await supabase
    .from("personal_loans")
    .select("id")
    .eq("organization_id", organizationId)
    .ilike("lender_name", cleanName)
    .limit(1);
  if (findError) throw findError;
  if (existing && existing.length > 0) return existing[0].id;

  const { data: created, error: createError } = await supabase
    .from("personal_loans")
    .insert({ organization_id: organizationId, lender_name: cleanName })
    .select("id")
    .single();
  if (createError) throw createError;
  return created.id;
}

/** Movimientos de UN prestamista, con saldo corrido (más reciente primero). */
export async function readMovimientos(loanId) {
  const [prestamosRes, pagosRes] = await Promise.all([
    supabase
      .from("other_income")
      .select("id, amount, description, income_date")
      .eq("loan_id", loanId)
      .eq("type", "loan")
      .order("income_date", { ascending: true }),
    supabase
      .from("expenses")
      .select("id, amount, description, expense_date")
      .eq("loan_id", loanId)
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

export async function append(organizationId, loanId, item) {
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

// Crea el reemplazo primero y borra el original despues: si algo falla a
// mitad de camino, el peor caso es un duplicado visible, nunca perder el
// movimiento original en silencio.
export async function update(organizationId, loanId, item) {
  await append(organizationId, loanId, item);
  await remove(item._row);
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
