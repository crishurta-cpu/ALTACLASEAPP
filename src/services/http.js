const DEFAULT_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 800;

/**
 * `fetch` con `AbortController` + timeout. Si el servidor no responde en
 * `timeoutMs`, aborta la petición en vez de dejarla colgada indefinidamente.
 */
export async function fetchConTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Igual que `fetchConTimeout`, con 1 reintento tras un backoff fijo si la
 * primera petición falla (timeout, red caída, etc.).
 *
 * SOLO usar con operaciones idempotentes (lecturas). Reintentar una
 * escritura (append/update/delete) es peligroso: si el servidor sí procesó
 * la primera petición pero la respuesta tardó más que el timeout, el
 * reintento duplicaría la operación (ej. una fila de INGRESOS repetida).
 * Para escrituras, usar `fetchConTimeout` sin reintento.
 */
export async function fetchConReintento(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  try {
    return await fetchConTimeout(url, options, timeoutMs);
  } catch {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return await fetchConTimeout(url, options, timeoutMs);
  }
}
