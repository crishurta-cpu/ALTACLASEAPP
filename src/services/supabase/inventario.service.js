import { supabase } from "./client";
import { findOrCreate as findOrCreateSupplier } from "./suppliers.service";
import { findOrCreate as findOrCreateProduct } from "./products.service";

/** Reemplaza services/sheets/inventario.service.js — tabla `purchases`. */

export async function readAll(organizationId) {
  const { data, error } = await supabase
    .from("purchases")
    .select("id, unit_cost, purchase_date, products ( name ), suppliers ( name )")
    .eq("organization_id", organizationId)
    .order("purchase_date", { ascending: false });
  if (error) throw error;
  return data.map((r) => ({
    id: "inv" + r.id,
    _row: r.id,
    fecha: r.purchase_date,
    producto: r.products?.name || "",
    proveedor: r.suppliers?.name || "",
    costo: Number(r.unit_cost) || 0,
  }));
}

export async function append(organizationId, item) {
  const productId = await findOrCreateProduct(organizationId, item.producto);
  const supplierId = await findOrCreateSupplier(organizationId, item.proveedor);
  const { error } = await supabase.from("purchases").insert({
    organization_id: organizationId,
    product_id: productId,
    supplier_id: supplierId,
    quantity: 1,
    unit_cost: Number(item.costo) || 0,
    purchase_date: item.fecha,
  });
  if (error) throw error;
}

export async function update(organizationId, item) {
  const productId = await findOrCreateProduct(organizationId, item.producto);
  const supplierId = await findOrCreateSupplier(organizationId, item.proveedor);
  const { error } = await supabase
    .from("purchases")
    .update({
      product_id: productId,
      supplier_id: supplierId,
      unit_cost: Number(item.costo) || 0,
      purchase_date: item.fecha,
    })
    .eq("id", item._row);
  if (error) throw error;
}

export async function remove(rowNum) {
  const { error } = await supabase.from("purchases").delete().eq("id", rowNum);
  if (error) throw error;
}
