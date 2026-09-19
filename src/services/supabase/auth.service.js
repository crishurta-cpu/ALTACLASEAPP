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
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return () => data.subscription.unsubscribe();
}

/**
 * Envia el correo de "olvidé mi contraseña". El link lleva de vuelta a esta
 * misma app (redirectTo = origin actual, sirve igual en local y en
 * produccion) — Supabase abre la sesion en modo recovery y dispara el
 * evento PASSWORD_RECOVERY (ver AuthProvider), que muestra la pantalla de
 * "definir nueva contraseña" en vez de la app normal.
 */
export async function resetPasswordForEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

/** Cambia la contraseña de la sesion activa (recovery o ya logueado). */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * Envia un codigo de 6 digitos al correo de la cuenta para verificar
 * identidad antes de cambiar la contraseña (pantalla interna de
 * Configuracion, no el flujo de "olvidé mi contraseña"). No crea usuario
 * nuevo: si el correo no existe, Supabase devuelve error.
 */
export async function sendPasswordChangeCode(email) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) throw error;
}

/** Verifica el codigo recibido por correo; si es correcto, refresca la sesion. */
export async function verifyPasswordChangeCode(email, code) {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) throw error;
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
