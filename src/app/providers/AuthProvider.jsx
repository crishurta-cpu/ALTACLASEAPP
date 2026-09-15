import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LS_AUTH_KEY } from "../../constants";
import { AuthContext } from "../contexts/AuthContext";

const INACTIVITY_MS = 3 * 60 * 1000; // 3 minutos

/**
 * Sesión: autenticado (persistido en localStorage), cierre por inactividad
 * (3 min sin touch/click/tecla/scroll) y cierre al cerrar/recargar el navegador.
 * Comportamiento idéntico al que vivía inline en App.jsx antes de Fase 16.
 */
export function AuthProvider({ children }) {
  const [autenticado, setAutenticado] = useState(
    () => localStorage.getItem(LS_AUTH_KEY) === "1"
  );
  const inactivityRef = useRef(null);

  const login = useCallback(() => setAutenticado(true), []);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(LS_AUTH_KEY);
    setAutenticado(false);
  }, []);

  // Cierra sesión al cerrar/recargar el navegador
  useEffect(() => {
    const onUnload = () => localStorage.removeItem(LS_AUTH_KEY);
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  // Timeout de inactividad: reinicia con cada toque/click/tecla
  useEffect(() => {
    if (!autenticado) return;
    const reset = () => {
      clearTimeout(inactivityRef.current);
      inactivityRef.current = setTimeout(cerrarSesion, INACTIVITY_MS);
    };
    const events = ["touchstart", "mousedown", "keydown", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset(); // iniciar el timer al autenticarse
    return () => {
      clearTimeout(inactivityRef.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [autenticado, cerrarSesion]);

  const value = useMemo(
    () => ({ autenticado, login, cerrarSesion }),
    [autenticado, login, cerrarSesion]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
