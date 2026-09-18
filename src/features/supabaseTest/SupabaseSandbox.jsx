import { useEffect, useState } from "react";
import * as authService from "../../services/supabase/auth.service";
import * as tasksService from "../../services/supabase/tasks.service";

/**
 * Pantalla de prueba de la migracion a Supabase (Fase M2), aislada del flujo
 * de produccion (Sheets). Se accede con ?supabase=1 en la URL, no se cruza
 * con AuthProvider/DataProvider actuales. Sirve para validar signup, login,
 * creacion de organizacion y un CRUD real (tasks) antes de tocar la app viva.
 */
function SupabaseSandbox() {
  const [session, setSession] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState("");

  useEffect(() => {
    authService.getSession().then(setSession);
    return authService.onAuthStateChange(setSession);
  }, []);

  useEffect(() => {
    if (!session) {
      setOrganizationId(null);
      return;
    }
    authService.ensureOrganization().then(setOrganizationId).catch((e) => setError(e.message));
  }, [session]);

  useEffect(() => {
    if (!organizationId) return;
    tasksService.readAll(organizationId).then(setTasks).catch((e) => setError(e.message));
  }, [organizationId]);

  const handleAuth = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn(email, password);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAgregarTarea = async () => {
    if (!nuevaTarea.trim()) return;
    try {
      const t = await tasksService.append(organizationId, nuevaTarea.trim());
      setTasks((prev) => [t, ...prev]);
      setNuevaTarea("");
    } catch (e) {
      setError(e.message);
    }
  };

  const handleToggle = async (t) => {
    try {
      await tasksService.toggleDone(t.id, !t.done);
      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEliminar = async (id) => {
    try {
      await tasksService.remove(id);
      setTasks((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 24, fontFamily: "sans-serif" }}>
      <h2>Sandbox Supabase (Fase M2)</h2>
      <p style={{ fontSize: 13, color: "#888" }}>
        Pantalla de prueba, no afecta la app en produccion contra Sheets.
      </p>

      {!session ? (
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button disabled={busy} onClick={() => handleAuth(authService.signUp)}>
              Crear cuenta
            </button>
            <button disabled={busy} onClick={() => handleAuth(authService.signIn)}>
              Iniciar sesión
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>
            Sesión: <b>{session.user.email}</b>
          </p>
          <p>Organization ID: {organizationId || "resolviendo..."}</p>
          <button onClick={() => authService.signOut()}>Cerrar sesión</button>

          {organizationId && (
            <div style={{ marginTop: 24 }}>
              <h3>Tareas (tabla nueva de Supabase)</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  value={nuevaTarea}
                  onChange={(e) => setNuevaTarea(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAgregarTarea()}
                  placeholder="Nueva tarea"
                  style={{ flex: 1, padding: 8 }}
                />
                <button onClick={handleAgregarTarea}>Agregar</button>
              </div>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}
                  >
                    <input type="checkbox" checked={t.done} onChange={() => handleToggle(t)} />
                    <span style={{ flex: 1, textDecoration: t.done ? "line-through" : "none" }}>
                      {t.title}
                    </span>
                    <button onClick={() => handleEliminar(t.id)}>Borrar</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
    </div>
  );
}

export default SupabaseSandbox;
