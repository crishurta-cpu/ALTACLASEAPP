import { supabase } from "./client";

/** Datos de la empresa (nombre, NIT, dirección, ciudad) para Configuración. */
export async function readCompanyInfo(organizationId) {
  const { data, error } = await supabase
    .from("organizations")
    .select("name, nit, address, city")
    .eq("id", organizationId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompanyInfo(organizationId, data) {
  const { error } = await supabase
    .from("organizations")
    .update({
      name: String(data.name || "").trim(),
      nit: String(data.nit || "").trim() || null,
      address: String(data.address || "").trim() || null,
      city: String(data.city || "").trim() || null,
    })
    .eq("id", organizationId);
  if (error) throw error;
}
