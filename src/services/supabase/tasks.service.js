import { supabase } from "./client";

export async function readAll(organizationId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function append(organizationId, title) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ organization_id: organizationId, title })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleDone(id, done) {
  const { error } = await supabase.from("tasks").update({ done }).eq("id", id);
  if (error) throw error;
}

export async function remove(id) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
