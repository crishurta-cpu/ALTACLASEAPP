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
 *
 * `organization_members.user_id` tiene un UNIQUE constraint (un usuario =
 * una sola organizacion). Esto importa porque Supabase dispara mas de un
 * evento de auth al cargar la sesion (INITIAL_SESSION y luego SIGNED_IN),
 * y ambos pueden llamar a este metodo casi al mismo tiempo — sin el
 * constraint, las dos llamadas veian "sin membresia" y creaban 2
 * organizaciones para el mismo usuario (bug real, corregido 2026-09-19).
 * Si el RPC choca contra el constraint, la otra llamada ya gano la carrera:
 * simplemente se relee la membresia real en vez de fallar.
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
  if (rpcError) {
    if (rpcError.code === "23505") {
      // Ya existe (la ganó otra llamada concurrente) — releer.
      const { data: existing, error: retryError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .limit(1)
        .single();
      if (retryError) throw retryError;
      return existing.organization_id;
    }
    throw rpcError;
  }
  return organizationId;
}
