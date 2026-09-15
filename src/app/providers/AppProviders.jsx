import { AuthProvider } from "./AuthProvider";
import { ToastProvider, ToastHost } from "./ToastProvider";
import { DataProvider } from "./DataProvider";
import { NavProvider } from "./NavProvider";

/**
 * Composition root de los providers de dominio. Orden fijo por dependencias:
 * DataProvider necesita `autenticado` (AuthProvider) y `flash` (ToastProvider).
 * `ToastHost` vive como hermano de `children` a propósito: así, cuando cambia
 * el toast, solo `ToastHost` se re-renderiza — no el resto del árbol de la app.
 */
export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ToastHost />
        <DataProvider>
          <NavProvider>{children}</NavProvider>
        </DataProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
