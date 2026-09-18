import { useContext } from "react";
import { NavContext } from "../contexts/NavContext";

/** Retorna { tab, setTab, showNuevo, setShowNuevo, editIng, setEditIng, editGas, setEditGas }. */
export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav debe usarse dentro de <NavProvider>");
  return ctx;
}
