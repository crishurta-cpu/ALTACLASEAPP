import { supabase } from "./client";

/**
 * Busca por nombre (case-insensitive) en una tabla catalogo (customers/
 * suppliers/products) y crea el registro si no existe. Estas tablas exigen
 * un nombre unico por organizacion en la practica de la app, aunque el
 * esquema no tenga un UNIQUE constraint — se resuelve aqui para no duplicar
 * "NIKE" y "nike" como dos proveedores distintos.
 */
export async function findOrCreateByName(table, organizationId, name, extra = {}) {
  const cleanName = String(name || "").trim();
  if (!cleanName) throw new Error(`Falta el nombre para crear en ${table}`);

  const { data: existing, error: findError } = await supabase
    .from(table)
    .select("id, name")
    .eq("organization_id", organizationId)
    .ilike("name", cleanName)
    .limit(1);
  if (findError) throw findError;
  if (existing && existing.length > 0) return existing[0].id;

  // customers tiene UNIQUE (organization_id, document_number) — un "" fijo
  // para todos los clientes sin documento choca en el segundo cliente nuevo
  // (bug real visto en produccion 2026-09-19). Se genera un placeholder unico.
  const uniqueExtra =
    table === "customers" && !extra.document_number
      ? { ...extra, document_number: `SIN-DOC-${crypto.randomUUID()}` }
      : extra;

  const { data: created, error: createError } = await supabase
    .from(table)
    .insert({ organization_id: organizationId, name: cleanName, ...uniqueExtra })
    .select("id")
    .single();
  if (createError) throw createError;
  return created.id;
}
