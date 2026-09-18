import { useCallback, useContext, useMemo, useState } from "react";
import { K } from "../../constants";
import { ToastStateContext, ToastDispatchContext } from "../contexts/ToastContext";

// Contextos separados a propósito: el valor del toast (cambia seguido, vive
// muy poco) va en uno, y `flash` (función estable, se llama desde muchas
// mutaciones de datos) va en otro. Así, un componente que solo necesita
// `flash` (ej. DataProvider) no se re-renderiza cada vez que aparece/desaparece
// un toast — solo `ToastHost` (el único que lee el valor) lo hace.

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const flash = useCallback((msg, col = K.gold) => {
    setToast({ msg, col });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const dispatchValue = useMemo(() => ({ flash }), [flash]);

  return (
    <ToastDispatchContext.Provider value={dispatchValue}>
      <ToastStateContext.Provider value={toast}>
        {children}
      </ToastStateContext.Provider>
    </ToastDispatchContext.Provider>
  );
}

/** Único consumidor del valor del toast. Renderiza el "pill" flotante premium. */
export function ToastHost() {
  const toast = useContext(ToastStateContext);
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: "max(24px, env(safe-area-inset-top, 24px))",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(22,22,31,.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        color: K.text,
        padding: "11px 22px",
        borderRadius: 20,
        fontWeight: 600,
        zIndex: 9999,
        fontSize: 13,
        boxShadow: "0 8px 32px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.06) inset",
        whiteSpace: "nowrap",
        border: "1px solid rgba(255,255,255,.08)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: K.gold, display: "inline-block", flexShrink: 0 }} />
      {toast.msg}
    </div>
  );
}
