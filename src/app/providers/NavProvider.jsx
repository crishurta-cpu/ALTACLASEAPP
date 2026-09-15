import { useMemo, useState } from "react";
import { NavContext } from "../contexts/NavContext";

/**
 * Navegación de la app: tab activo, modal de "nuevo movimiento" y los
 * items en edición (ingreso/gasto) que abren su modal correspondiente.
 */
export function NavProvider({ children }) {
  const [tab, setTab] = useState("home"); // siempre inicia en home
  const [showNuevo, setShowNuevo] = useState(false);
  const [editIng, setEditIng] = useState(null);
  const [editGas, setEditGas] = useState(null);

  const value = useMemo(
    () => ({ tab, setTab, showNuevo, setShowNuevo, editIng, setEditIng, editGas, setEditGas }),
    [tab, showNuevo, editIng, editGas]
  );

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
