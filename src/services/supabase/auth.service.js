import { supabase } from "./client";

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

/**
 * Devuelve el organization_id del usuario autenticado. Si no tiene ninguna
 * membresia todavia (primer signup), crea la organizacion por defecto una
 * sola vez via el RPC SECURITY DEFINER create_organization.
 */
export async function ensureOrganization(defaultName = "Altaclase Bodega") {
  const { data: memberships, error: readError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .limit(1);
  if (readError) throw readError;

  if (memberships && memberships.length > 0) {
    return memberships[0].organization_id;
  }

  const { data: organizationId, error: rpcError } = await supabase.rpc("create_organization", {
    p_name: defaultName,
  });
  if (rpcError) throw rpcError;
  return organizationId;
}
