import { useCallback, useEffect, useState } from "react";
import { ACCENT_KEY, getAccentColor, getThemeOverrides, setThemeOverrides } from "../../constants";

/**
 * Color de acento reactivo: lee/escribe `localStorage[ACCENT_KEY]` y se
 * mantiene sincronizado entre instancias vía el evento `"accentchange"`
 * (mismo evento que ya disparaba `AccentPicker`; antes nadie lo escuchaba,
 * así que el cambio de color solo se reflejaba en el próximo re-render
 * incidental de cada componente — no era instantáneo).
 *
 * Retorna [accentId, color, setAccent].
 */
export function useAccentColor() {
  // El contador fuerza el re-render también cuando cambia el tema completo
  // (fondos, tarjetas, acento personalizado) sin que cambie el id de acento.
  const [, setVersion] = useState(0);
  const accentId = localStorage.getItem(ACCENT_KEY) || "gold";

  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    window.addEventListener("accentchange", onChange);
    return () => window.removeEventListener("accentchange", onChange);
  }, []);

  const setAccent = useCallback((id) => {
    localStorage.setItem(ACCENT_KEY, id);
    // Elegir un preset descarta el acento personalizado del editor de tema.
    const { accent, ...resto } = getThemeOverrides();
    if (accent) setThemeOverrides(resto);
    else window.dispatchEvent(new Event("accentchange"));
  }, []);

  return [accentId, getAccentColor(), setAccent];
}
