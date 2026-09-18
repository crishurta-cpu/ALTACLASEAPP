import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copiar .env.example a .env.local y completar."
  );
}

/**
 * Cliente único de Supabase (proyecto ALTAREFACTORIZADA, ref ipekysprglakoxblzxqg).
 * Usa la clave pública (`anon`/`publishable`) — segura para el bundle del navegador,
 * el acceso real lo controla RLS (`is_org_member`) sobre el usuario autenticado.
 * Nunca importar aquí la clave `service_role`/`secret`.
 */
export const supabase = createClient(url, anonKey);
