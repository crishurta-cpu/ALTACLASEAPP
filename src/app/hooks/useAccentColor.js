import { useCallback, useEffect, useState } from "react";
import { ACCENT_KEY, ACCENTS } from "../../constants";

const idToColor = (id) => ACCENTS.find((a) => a.id === id)?.color || ACCENTS[0].color;

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
  const [accentId, setAccentId] = useState(() => localStorage.getItem(ACCENT_KEY) || "gold");

  useEffect(() => {
    const onChange = () => setAccentId(localStorage.getItem(ACCENT_KEY) || "gold");
    window.addEventListener("accentchange", onChange);
    return () => window.removeEventListener("accentchange", onChange);
  }, []);

  const setAccent = useCallback((id) => {
    localStorage.setItem(ACCENT_KEY, id);
    window.dispatchEvent(new Event("accentchange"));
  }, []);

  return [accentId, idToColor(accentId), setAccent];
}
