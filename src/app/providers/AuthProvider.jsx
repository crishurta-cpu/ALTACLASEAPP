import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import * as authService from "../../services/supabase/auth.service";

const INACTIVITY_MS = 3 * 60 * 1000; // 3 minutos

/**
 * Sesion real de Supabase Auth (Fase M5, cutover — reemplaza CLAVE_ACCESO).
 * Supabase persiste su propia sesion (localStorage interno del SDK), asi
 * que a diferencia de la version Sheets NO cerramos sesion en beforeunload:
 * recargar/cerrar el navegador no debe deslogear (parte de la validacion
 * de Fase M2 en docs/SUPABASE_MIGRATION_ROADMAP.md).
 * El cierre por inactividad (3 min) se conserva igual.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const inactivityRef = useRef(null);

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s);
      setAuthLoading(false);
    });
    return authService.onAuthStateChange((s) => setSession(s));
  }, []);

  useEffect(() => {
    if (!session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset real, no estado derivado
      setOrganizationId(null);
      return;
    }
    authService.ensureOrganization().then(setOrganizationId);
  }, [session]);

  const signIn = useCallback(async (email, password) => {
    await authService.signIn(email, password);
  }, []);

  const signUp = useCallback(async (email, password) => {
    await authService.signUp(email, password);
  }, []);

  const cerrarSesion = useCallback(async () => {
    await authService.signOut();
  }, []);

  // Timeout de inactividad: reinicia con cada toque/click/tecla
  useEffect(() => {
    if (!session) return;
    const reset = () => {
      clearTimeout(inactivityRef.current);
      inactivityRef.current = setTimeout(cerrarSesion, INACTIVITY_MS);
    };
    const events = ["touchstart", "mousedown", "keydown", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(inactivityRef.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [session, cerrarSesion]);

  const value = useMemo(
    () => ({
      autenticado: !!session,
      authLoading,
      organizationId,
      email: session?.user?.email || null,
      signIn,
      signUp,
      cerrarSesion,
    }),
    [session, authLoading, organizationId, signIn, signUp, cerrarSesion]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
