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
