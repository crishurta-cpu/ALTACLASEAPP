import { supabase } from "./client";
import { findOrCreateByName } from "./shared";

/**
 * Resumen por cliente, shape compatible con el viejo `clientesResumen` de
 * Sheets (Fase M5): solo los campos que la UI de verdad consume (cliente,
 * saldo, abonos, deudaTotal, debe) — ver useDeudaPorCliente/useDeudaResumen.
 * `v_customer_balances` ya trae total_sales/total_paid/balance calculados.
 */
export async function readResumen(organizationId) {
  const { data, error } = await supabase
    .from("v_customer_balances")
    .select("customer_name, total_sales, total_paid, balance")
    .eq("organization_id", organizationId);
  if (error) throw error;
  return data.map((c) => ({
    cliente: c.customer_name,
    totalVenta: Number(c.total_sales) || 0,
    totalIngresos: Number(c.total_sales) || 0,
    saldo: Number(c.total_sales) || 0,
    abonos: Number(c.total_paid) || 0,
    deudaTotal: Number(c.balance) || 0,
    debe: Number(c.balance) > 0 ? "SI" : "NO",
    gananciaSheet: 0,
  }));
}

export async function findOrCreate(organizationId, name) {
  return findOrCreateByName("customers", organizationId, name, {
    document_number: "",
    phone: "",
    address: "",
    city: "",
  });
}

/** Trae el registro completo (no solo el resumen) para poder editarlo. */
export async function findByName(organizationId, name) {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, document_number, phone, address, city, notes, credit_enabled")
    .eq("organization_id", organizationId)
    .ilike("name", String(name || "").trim())
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

/**
 * document_number tiene UNIQUE (organization_id, document_number) y no
 * admite null — si el campo queda vacío se genera un placeholder único en
 * vez de mandar "" (chocaría con cualquier otro cliente sin documento,
 * mismo bug ya corregido en shared.js para la creación).
 */
export async function update(organizationId, id, data) {
  const documentNumber = String(data.document_number || "").trim() || `SIN-DOC-${crypto.randomUUID()}`;
  const { error } = await supabase
    .from("customers")
    .update({
      name: String(data.name || "").trim(),
      document_number: documentNumber,
      phone: String(data.phone || "").trim(),
      address: String(data.address || "").trim(),
      city: String(data.city || "").trim(),
      notes: String(data.notes || "").trim() || null,
      credit_enabled: !!data.credit_enabled,
    })
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw error;
}
