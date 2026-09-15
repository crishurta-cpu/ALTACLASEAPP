import { useContext } from "react";
import { ToastDispatchContext } from "../contexts/ToastContext";

/** Retorna { flash }. `flash(msg, col?)` muestra un toast por 2.5s. */
export function useToast() {
  const ctx = useContext(ToastDispatchContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
